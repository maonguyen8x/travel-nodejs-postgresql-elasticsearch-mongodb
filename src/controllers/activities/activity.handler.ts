import {AnyObject, Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {
  ActivityBookmarkRepository,
  ActivityParticipantRepository,
  ActivityInviteeRepository,
  ActivityRepository,
  LocationsRepository,
  PostsRepository,
  UsersRepository,
} from '../../repositories';
import {Activity, ActivityParticipant, ActivityParticipantWithRelations, Users} from '../../models';
import {
  ActivityDetailResponseInterface,
  ActivityParticipantResponseInterface,
  ActivityStatusEnum,
  CreateActivityRequestInterface,
  participantStatusEnum,
} from './activity.constant';
import {POST_ACCESS_TYPE_PUBLIC, POST_TYPE_ACTIVITY, PostStatusEnum} from '../../configs/post-constants';
import _, {get as getProperty, get, omit, isEmpty} from 'lodash';
import {handleError} from '../../utils/handleError';
import {inject} from '@loopback/context';
import {FollowsLogicController, NotificationLogicController, PostLogicController} from '..';
import {asyncLimiter} from '../../utils/Async-limiter';
import {HttpErrors} from '@loopback/rest/dist';
import {changeAlias, concatStringForElastic, parseStringToGeo} from '../../utils/handleString';
import {sortByList} from '../../utils/Array';
import moment from 'moment';
import {ErrorCode} from '../../constants/error.constant';
import {ElasticSearchResultHitInterface, ELASTICwhereToMatchs, getHit} from '../../configs/utils-constant';
import {ActivityNotifyTypeEnum, NOTIFICATION_TYPE_EDIT_ACTIVITY} from '../../configs/notification-constants';
import {FilterFollowersInterface} from '../follows/follow-interface';
import {activityParticipantQuery, validateUpdateActivity, validateActivity, formatActivityParticipant} from './activity.util';

export class ActivityHandler {
  constructor(
    @repository(ActivityRepository)
    public activityRepository: ActivityRepository,
    @repository(ActivityParticipantRepository)
    public activityParticipantRepository: ActivityParticipantRepository,
    @repository(ActivityInviteeRepository)
    public activityInviteeRepository: ActivityInviteeRepository,
    @repository(ActivityBookmarkRepository)
    public activityBookmarkRepository: ActivityBookmarkRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @inject('controllers.FollowsLogicController')
    public followsLogicController: FollowsLogicController,
  ) {}

  async create(activity: CreateActivityRequestInterface, userId: number): Promise<Activity> {
    try {
      validateActivity(activity);

      const post = await this.postsRepository.create({
        content: activity.introduction,
        mediaContents: activity.mediaContents,
        postType: POST_TYPE_ACTIVITY,
        creatorId: userId,
        status: PostStatusEnum.draft,
        isPublicLocation: true,
        locationId: activity?.locationId,
        accessType: POST_ACCESS_TYPE_PUBLIC,
        showOnProfile: activity.showOnProfile,
      });

      const result = await this.activityRepository.create({
        ...omit(activity, ['location', 'introduction', 'mediaContents', 'showOnProfile']),
        locationId: activity?.locationId,
        postId: post.id,
        createdById: userId,
        status: ActivityStatusEnum.public,
      });

      await Promise.all([
        this.postsRepository.updateById(result.postId, {
          status: PostStatusEnum.public,
        }),
        this.postsRepository.updateById(result.postId, {
          status: PostStatusEnum.public,
        }),
      ]);

      this.handleUpdateElasticSearch(result.id, result);
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async updateById({
    activity,
    userId,
    activityId,
  }: {
    activity: CreateActivityRequestInterface;
    userId: number;
    activityId: number;
  }): Promise<{
    message: string;
  }> {
    try {
      validateUpdateActivity(activity);
      const currentActivity = await this.activityRepository.findById(activityId);
      if (currentActivity.createdById !== userId) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }

      await Promise.all([
        this.postsRepository.updateById(currentActivity?.postId, {
          content: activity.introduction,
          mediaContents: activity.mediaContents,
          postType: POST_TYPE_ACTIVITY,
          creatorId: userId,
          status: PostStatusEnum.public,
          isPublicLocation: true,
          locationId: currentActivity.locationId,
          accessType: POST_ACCESS_TYPE_PUBLIC,
          showOnProfile: activity.showOnProfile,
        }),
        this.activityRepository.updateById(activityId, {
          ...omit(activity, ['location', 'introduction', 'mediaContents']),
          locationId: currentActivity.locationId,
          postId: activity.postId,
          createdById: userId,
          status: ActivityStatusEnum.public,
        }),
      ]);
      const result = await this.activityRepository.findById(activityId);
      this.handleUpdateElasticSearch(result.id, result);

      await this.postLogicController.sendNotifyActivity(result, NOTIFICATION_TYPE_EDIT_ACTIVITY);
      return {
        message: 'Update activity successful',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async find({
    filter,
    userId,
    activitySearch,
  }: {
    filter?: Filter<Activity>;
    userId: number;
    activitySearch?: {
      q?: string;
      coordinates?: string;
      distance?: number;
      dateSearch?: string;
    };
  }): Promise<{
    data: ActivityDetailResponseInterface[];
    count: number;
  }> {
    try {
      const where = {
        ...filter?.where,
      };
      const musts = ELASTICwhereToMatchs(where);
      const must: AnyObject[] = [...musts];
      if (activitySearch?.q?.length) {
        must.push({
          multi_match: {
            query: changeAlias(activitySearch?.q).trim(),
            operator: 'and',
            fields: ['country', 'areaLevel1'],
          },
        });
      }
      if (activitySearch?.dateSearch) {
        must.push({
          bool: {
            should: [
              {
                range: {
                  from: {
                    gte: moment(activitySearch?.dateSearch).startOf('day').toISOString(),
                  },
                },
              },
              {
                range: {
                  to: {
                    gte: moment(activitySearch?.dateSearch).startOf('day').toISOString(),
                  },
                },
              },
            ],
            minimum_should_match: 1,
          },
        });
      }

      const body: AnyObject = {
        sort: [
          {
            participantNumber: {
              order: 'desc',
            },
          },
          // ...parseOrderToElasticSort(filter?.order || ['']),
        ],
        ...(filter?.limit ? {size: filter?.limit} : {}),
        ...(filter?.offset ? {from: filter?.offset} : {}),
        query: {
          bool: {
            must: must,
          },
        },
      };
      if (activitySearch?.coordinates) {
        body.sort = [
          {
            _geo_distance: {
              coordinates: activitySearch?.coordinates,
              order: 'asc',
              unit: 'km',
            },
          },
        ];

        body.script_fields = {
          distance: {
            script: {
              params: parseStringToGeo(activitySearch?.coordinates),
              source: "doc['coordinates'].arcDistance(params.lat,params.lon)",
            },
          },
        };

        body.stored_fields = ['_source'];
        if (activitySearch?.distance) {
          body.query.bool = {
            ...body.query.bool,
            filter: {
              geo_distance: {
                distance: `${activitySearch?.distance}m`,
                coordinates: activitySearch?.coordinates,
              },
            },
          };
        }
      }

      const searchResult = await this.activityRepository.elasticService.get(body);
      let count: number;
      // eslint-disable-next-line prefer-const
      count = getProperty(searchResult, 'body.hits.total.value', 0);
      const hit = getProperty(searchResult, 'body.hits.hits', []);
      const getIdFromHit = (item: {
        _source: {
          id: number;
        };
      }) => {
        return item._source.id || 0;
      };
      let listResultId = Array.from(hit, getIdFromHit);

      listResultId = listResultId.filter((item) => item);

      const promise = listResultId.map(async (id: number) => {
        return this.findById({
          id,
          userId,
        });
      });
      const data = (await asyncLimiter(promise)).filter((item: ActivityDetailResponseInterface) => item);
      return {
        data: sortByList(data, 'id', listResultId),
        count,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findById({
    id,
    filter,
    userId,
  }: {
    id: number;
    userId: number;
    filter?: FilterExcludingWhere<Activity>;
  }): Promise<ActivityDetailResponseInterface> {
    try {
      const activity = await this.activityRepository.findById(id, {
        ...filter,
        include: [
          {
            relation: 'currency',
          },
          {
            relation: 'location',
          },
          {
            relation: 'post',
            scope: {
              include: [
                {
                  relation: 'mediaContents',
                },
              ],
            },
          },
        ],
      });

      const participantCount = await this.activityParticipantRepository.count({
        activityId: id,
        status: {
          nin: [participantStatusEnum.remove],
        },
      });
      const joined = await this.activityParticipantRepository.findOne({
        where: {
          activityId: id,
          userId,
          status: {
            nin: [participantStatusEnum.remove],
          },
        },
      });
      return {
        mediaContents: activity?.post?.mediaContents || [],
        introduction: activity?.post?.content,
        ...activity,
        participantCount: participantCount.count,
        joined: Boolean(joined),
        showOnProfile: activity?.post?.showOnProfile,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById(activityId: number, userId: number): Promise<{message: string}> {
    try {
      const activity = await this.activityRepository.findById(activityId);

      if(activity?.createdById !== userId){
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
      await this.activityRepository.deleteById(activityId);

      await this.activityRepository.elasticService.deleteById(activityId)
      return {
        message: 'Delete Activity Successful',
      };
    } catch (e) {
      return {
        message: e.message,
      };
    }
  }

  async joinActivity(activityId: number, userId: number): Promise<{message: string}> {
    try {
      const activity = await this.activityRepository.findById(activityId);
      if (moment().isBefore(activity.to) || moment().isSameOrBefore(activity.from)) {
        const isRemove = Boolean(
          await this.activityParticipantRepository.findOne({
            where: {
              status: participantStatusEnum.remove,
              userId,
              activityId,
            },
          }),
        );
        if (isRemove) {
          throw new HttpErrors.BadRequest(ErrorCode.ACTIVITY_HAS_BANED);
        }
        await this.activityParticipantRepository.create({
          userId,
          activityId,
          status: participantStatusEnum.join,
        });
        await this.handleUpdateElasticSearch(activityId, activity);
        if (activity.createdById !== userId) {
          this.notificationLogicController.createNotifyActivity({
            activityId,
            eventCreatorId: userId,
            userIds: [activity.createdById],
            type: ActivityNotifyTypeEnum.join,
          });
        }
        return {
          message: 'Join activity successful',
        };
      } else {
        throw new HttpErrors.BadRequest(ErrorCode.ACTIVITY_HAS_ENDED);
      }
    } catch (e) {
      handleError(e);
      return {
        message: 'Join activity failure',
      };
    }
  }

  async leftActivity(activityId: number, userId: number): Promise<{message: string}> {
    try {
      const activity = await this.activityRepository.findById(activityId);
      if (moment().isBefore(activity.to) || moment().isSameOrBefore(activity.from)) {
        await this.activityParticipantRepository.deleteAll({
          userId,
          activityId,
        });
        await this.handleUpdateElasticSearch(activityId, activity);
        return {
          message: 'Left activity successful',
        };
      } else {
        throw new HttpErrors.BadRequest(ErrorCode.ACTIVITY_HAS_ENDED);
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async findInviteeWithFollowings({ userId, activityId, filter,}: { userId: number; activityId: number; filter: FilterFollowersInterface; }): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const [followings, listInvitee] = await Promise.all([
      this.followsLogicController.followings(userId, userId, filter),
      this.activityInviteeRepository.find({
        where: {
          activityId,
          status: participantStatusEnum.invited,
        },
      }),
    ]);
    const inviteeIds = listInvitee.map((item) => item.userId);
    const followingsRemovePage = _.filter(followings.data, function (o) {
      return !o.relatedPageId;
    });
    followingsRemovePage.forEach((item) => {
      if (inviteeIds.includes(item.id)) {
        item.inviteStatus = participantStatusEnum.invited;
      } else {
        item.inviteStatus = participantStatusEnum.uninvited;
      }
    });
    return {
      data: followingsRemovePage,
      count: followingsRemovePage.length,
    };
  }

  async findParticipant({
    filter,
    userId,
    activityId,
    activityParticipantSearch,
  }: {
    filter?: Filter<ActivityParticipant>;
    userId: number;
    activityId: number;
    activityParticipantSearch?: {
      q?: string;
    };
  }): Promise<{
    count: number;
    data: ActivityParticipantResponseInterface[];
  }> {
    const cusFilter = {
      ...filter,
      ...activityParticipantQuery(userId),
      where: {
        ...filter?.where,
        activityId,
        status: participantStatusEnum.join,
      },
    };
    let count = 0;
    let data: ActivityParticipantWithRelations[] = [];
    const q = activityParticipantSearch?.q;
    if (q?.length) {
      const alluserIds = (
        await this.activityParticipantRepository.find({
          where: {
            activityId,
            status: participantStatusEnum.join,
          },
        })
      ).map((item) => item.userId);
      const where = {
        id: {
          inq: alluserIds,
        },
      };
      const musts = ELASTICwhereToMatchs(where);
      musts.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['name'],
        },
      });
      const body: AnyObject = {
        sort: [
          ...(q?.length
            ? [
                {
                  _score: {
                    order: 'desc',
                  },
                },
              ]
            : []),
        ],
        _source: ['id'],
        ...(filter?.limit ? {size: filter?.limit} : {}),
        ...(filter?.offset ? {from: filter?.offset} : {}),
        query: {
          bool: {
            must: musts,
          },
        },
      };
      const searchResult = await this.usersRepository.elasticService.get(body);
      if (!isEmpty(searchResult)) {
        count = get(searchResult, 'body.hits.total.value', 0);
        const hit = getHit(searchResult);
        const userIds = Array.from(hit, (item: ElasticSearchResultHitInterface) => get(item, '_source.id')).filter(
          (item) => item,
        );
        const results = await this.activityParticipantRepository.find({
          ...cusFilter,
          where: {
            userId: {
              inq: userIds,
            },
          },
        });
        data = sortByList(results, 'userId', userIds);
      }
    } else {
      const [newData, newCount] = await Promise.all([
        this.activityParticipantRepository.find(cusFilter),
        this.activityParticipantRepository.count(cusFilter.where),
      ]);

      return {
        data: newData,
        count: newCount.count || 0,
      };
    }
    return {
      data: data.map((item) => formatActivityParticipant(item)),
      count,
    };
  }

  async inviteJoinActivity({
    activityId,
    userId,
    listUser,
  }: {
    activityId: number;
    userId: number;
    listUser: number[];
  }): Promise<{message: string}> {
    try {
      await this.activityInviteeRepository.create({
        userId: listUser[0],
        activityId,
        status: participantStatusEnum.invited,
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.notificationLogicController.createNotifyActivity({
        activityId,
        eventCreatorId: userId,
        userIds: listUser,
        type: ActivityNotifyTypeEnum.invite,
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.handleRemoveBan({
        activityId,
        userId,
        listUser,
      });
      return {
        message: 'Invited successful',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async handleRemoveBan({
    activityId,
    userId,
    listUser,
  }: {
    activityId: typeof Activity.prototype.id;
    userId: typeof Users.prototype.id;
    listUser: number[];
  }): Promise<void> {
    try {
      const activity = await this.activityRepository.findById(activityId);
      if (userId === activity.createdById) {
        await this.activityParticipantRepository.deleteAll({
          userId: {
            inq: listUser,
          },
        });
      }
      await this.handleUpdateElasticSearch(activityId);
    } catch (e) {
      return handleError(e);
    }
  }

  async removeUserActivity({
    activityId,
    userId,
    listUser,
  }: {
    activityId: number;
    userId: number;
    listUser: number[];
  }): Promise<{message: string}> {
    try {
      const activity = await this.activityRepository.findById(activityId);
      if (activity.createdById !== userId) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
      const userRemove = await this.activityParticipantRepository.find({
        where: {
          userId: {
            inq: listUser,
          },
        },
      });
      await asyncLimiter(
        userRemove.map(async (participant) =>
          this.activityParticipantRepository.updateById(participant.id, {
            status: participantStatusEnum.remove,
          }),
        ),
      );
      await this.activityInviteeRepository.deleteAll({
        activityId,
        userId: {
          inq: listUser,
        },
      });
      await this.handleUpdateElasticSearch(activityId);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotifyActivity({
        activityId,
        eventCreatorId: userId,
        userIds: listUser,
        type: ActivityNotifyTypeEnum.remove,
      });
      return {
        message: 'Remove successful',
      };
    } catch (error) {
      handleError(error);
      return {
        message: 'Remove failure',
      };
    }
  }

  async remindActivity(): Promise<void> {
    try {
      const activities = await this.activityRepository.find({
        where: {
          from: {
            lte: moment().utc().add(1, 'd').startOf('d').toISOString(),
            gte: moment().utc().add(1, 'd').endOf('d').toISOString(),
          },
        },
      });
      await asyncLimiter(
        activities.map(async (activity) => {
          const participantIds = (
            await this.activityParticipantRepository.find({
              where: {
                activityId: activity.id,
                status: participantStatusEnum.join,
              },
            })
          ).map((item) => item.userId);
          await this.notificationLogicController.createNotifyActivity({
            type: ActivityNotifyTypeEnum.comingSoon,
            userIds: participantIds,
            activityId: activity.id,
          });
        }),
      );
    } catch (e) {
      handleError(e);
    }
  }

  async handleUpdateElasticSearch(id: typeof Activity.prototype.id, newActivity?: Activity) {
    const result = (newActivity?.id) ? newActivity : await this.activityRepository.findById(id);

    try {
      const [location, sumParticipant] = await Promise.all([
        this.locationsRepository.findById(result.locationId),
        this.activityParticipantRepository.count({
          activityId: result.id,
          status: participantStatusEnum.join,
        }),
      ]);
      await this.activityRepository.elasticService.updateById(
        {
          name: changeAlias(result.name || ''),
          address: changeAlias(location.address || ''),
          country: changeAlias(location.country || '').trim(),
          areaLevel1: changeAlias(location.areaLevel1 || '').trim(),
          id: result.id,
          coordinates: parseStringToGeo(location.coordinates || ''),
          createdAt: result.createdAt,
          blockedAt: result.blockedAt,
          from: result.from,
          to: result.to,
          participantNumber: sumParticipant.count || 0,
          price: result.price,
          search: concatStringForElastic(result?.name, location.address),
        },
        result.id,
      );
    } catch (e) {
      // No handle
    }
  }
}
