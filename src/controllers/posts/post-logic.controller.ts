import {inject} from '@loopback/context';
import {AnyObject, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import _, {get, omit} from 'lodash';
import {
  NOTIFICATION_TYPE_DELETE_ACTIVITY,
  NOTIFICATION_TYPE_EDIT_ACTIVITY,
  NOTIFICATION_TYPE_USER_COMMENT_POST,
  NOTIFICATION_TYPE_USER_REPLY_COMMENT,
} from '../../configs/notification-constants';
import {Activity, MediaContents, Posts, PostsWithRelations, Task, TaskWithRelations} from '../../models';
import {
  ActivityBookmarkRepository,
  ActivityParticipantRepository,
  ActivityRepository,
  ChildCommentRepository,
  DeviceTokenRepository,
  LocationsRepository,
  MaterializedViewLocationsRepository,
  PostsRepository,
  UsersRepository,
} from '../../repositories';
import {
  MyMapLogicController,
  NotificationLogicController,
  PlanLogicController,
  RankingLogicController,
  UserLogicController,
} from '..';
import {
  POST_ACCESS_TYPE_FOLLOW,
  POST_ACCESS_TYPE_PRIVATE,
  POST_ACCESS_TYPE_PUBLIC,
  POST_SEARCH_MODE_COMUNITY,
  POST_SEARCH_MODE_FOLLOW,
  POST_TYPE_ACTIVITY,
  POST_TYPE_CREATED,
  POST_TYPE_MY_MAP,
  POST_TYPE_PAGE,
  POST_TYPE_SHARE_PLAN,
  PostStatusEnum,
  POST_TYPE_SHARED,
  SEARCH_TYPE_COMMUNITY_LOCATION,
  SEARCH_TYPE_COMMUNITY_POST,
} from '../../configs/post-constants';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {UsersBlockHandler} from '../user-block/users-block.handler';
import {userInfoQuery} from '../specs/user-controller.specs';
import {HttpErrors} from '@loopback/rest';
import {handleError} from '../../utils/handleError';
import moment from 'moment';
import {ErrorCode} from '../../constants/error.constant';
import {PostDataWithFlagInterface} from './post.contant';
import {changeAlias, parseOrderToElasticSort} from '../../utils/handleString';
import {isEmpty} from 'lodash';
import {sortByList} from '../../utils/Array';
import {participantStatusEnum} from '../activities/activity.constant';
import {ELASTICwhereToMatchs, LANGUAGES} from '../../configs/utils-constant';
import {BookmarkLocationHandler} from '../bookmark-location/bookmark-location.handler';
import {FirebaseService} from '../../services';
import {LocationTypesEnum} from '../../configs/location-constant';
import {postInfoQueryWithBookmark} from './post.schema';

export class PostLogicController {
  constructor(
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @inject('controllers.MyMapLogicController')
    public myMapLogicController: MyMapLogicController,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @inject('controllers.RankingLogicController')
    public rankingLogicController: RankingLogicController,
    @repository(ChildCommentRepository)
    public childCommentRepository: ChildCommentRepository,
    @inject(HandlerBindingKeys.USERS_BLOCK_HANDLER)
    public usersBlockHandler: UsersBlockHandler,
    @inject('controllers.UserLogicController')
    public userLogicController: UserLogicController,
    @repository(ActivityRepository)
    public activityRepository: ActivityRepository,
    @repository(ActivityParticipantRepository)
    public activityParticipantRepository: ActivityParticipantRepository,
    @repository(ActivityBookmarkRepository)
    public activityBookmarkRepository: ActivityBookmarkRepository,
    @inject(HandlerBindingKeys.BOOKMARK_LOCATION_HANDLER)
    public bookmarkLocationHandler: BookmarkLocationHandler,
    @inject('firebase')
    public firebaseService: FirebaseService,
    @inject('controllers.PlanLogicController')
    public planLogicController: PlanLogicController,
    @repository(DeviceTokenRepository)
    public deviceInfoRepository: DeviceTokenRepository,
    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
  ) {}

  async create(posts: Partial<Omit<Posts, 'id'>>) {
    const result = await this.postsRepository.create({
      ...posts,
      ...(posts?.locationId ? {isPublicLocation: true} : {}),
      listUsersReceiveNotifications: String(posts.creatorId),
    });
    try {
      if (result.locationId) {
        await Promise.all([
          // TODO: Not yet update total review
          // this.updateTotalReview(result?.locationId),
          this.bookmarkLocationHandler.update({
            locationId: result.locationId,
            userId: result.creatorId,
          }),
          this.myMapLogicController.updateStateMyMap(result.creatorId, result.locationId),
          this.rankingLogicController.handleAccessRanking(result.creatorId, result.locationId),
          this.locationsRepository.updateById(result.locationId, {
            isPublished: true,
          }),
          this.postsRepository.updateElasticSearch(result.id),
        ]);
      }
    } catch (e) {
      return handleError(e);
    }
    return result;
  }

  async updateTotalReview(locationId: number): Promise<void> {
    const postCount = await this.postsRepository.count({
      locationId: locationId,
      isPublicLocation: true,
      accessType: POST_ACCESS_TYPE_PUBLIC,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      deletedAt: null,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      blockedAt: null,
    });
    await this.locationsRepository.updateById(locationId, {
      totalReview: postCount.count,
    });
  }

  async deleteById(
    id: number,
    {userId}: {userId: number},
  ): Promise<{
    message: string;
  }> {
    try {
      const result = await this.postsRepository.findById(id, {
        include: [{relation: 'page'}],
      });
      const creatorPageId = get(result, 'page.userId');
      if (userId !== result.creatorId && userId !== creatorPageId) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
      await Promise.all([
        this.postsRepository.updateById(id, {
          deletedAt: moment().utc().toISOString(),
        }),
        this.postsRepository.elasticService.deleteById(result.id),
      ]);
      if (result.locationId) {
        await Promise.all([
          this.bookmarkLocationHandler.update({
            locationId: result.locationId,
            userId: result.creatorId,
          }),
          this.myMapLogicController.updateStateMyMap(result.creatorId, result.locationId),
          this.rankingLogicController.handleAccessRanking(result.creatorId, result.locationId),
        ]);
      }
      if (result.postType === POST_TYPE_ACTIVITY) {
        const activity = await this.activityRepository.findOne({
          where: {
            postId: result.id,
          },
        });
        if (activity) {
          await Promise.all([
            this.activityBookmarkRepository.deleteAll({
              activityId: activity.id,
              userId,
            }),
            this.locationsRepository.deleteById(activity.locationId),
            this.activityRepository.deleteById(activity.id),
            this.sendNotifyActivity(activity, NOTIFICATION_TYPE_DELETE_ACTIVITY),
          ]);
        }
      }
      return {
        message: 'Delete post success',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async sendNotifyActivity(activity: Activity, activityType: string): Promise<void> {
    const activityParticipants = (
      await this.activityParticipantRepository.find({
        where: {
          activityId: activity.id,
        },
      })
    )
      .map((item) => item.userId)
      .filter((item) => item);
    const deviceTokens = (
      await this.deviceInfoRepository.find({
        where: {
          userId: {
            inq: activityParticipants,
          },
        },
      })
    )
      .map(function (item) {
        return {
          deviceToken: item.deviceToken || '',
          language: item.language || LANGUAGES.EN,
        };
      })
      .filter((item) => item);
    deviceTokens.forEach((item) => {
      this.firebaseService.message
        .sendToDevice(
          item.deviceToken,
          {
            data: {
              notificationType:
                activityType === NOTIFICATION_TYPE_DELETE_ACTIVITY
                  ? String(NOTIFICATION_TYPE_DELETE_ACTIVITY)
                  : String(NOTIFICATION_TYPE_EDIT_ACTIVITY),
              postId: String(activity.postId),
            },
            notification: {
              body:
                item.language === LANGUAGES.VI
                  ? activityType === NOTIFICATION_TYPE_DELETE_ACTIVITY
                    ? `Hoạt động ${activity.name} bạn đang tham gia đã được xoá bởi người tạo.`
                    : `Hoạt động ${activity.name} đã cập nhật thông tin.`
                  : activityType === NOTIFICATION_TYPE_DELETE_ACTIVITY
                  ? `${activity.name} Activity that you joined had been deleted by owner.`
                  : `${activity.name} Activity updated information.`,
              sound: 'bingbong.aiff',
            },
          },
          {
            contentAvailable: true,
            mutableContent: true,
          },
        )
        .then(() => {})
        .catch(() => {});
    });
  }

  async updatePostById(id: number, post: AnyObject): Promise<Posts> {
    const targetBefore = await this.postsRepository.findById(id);
    const dataReplace = {
      ...targetBefore,
      ...post,
    };
    if (post?.locationId === 0) {
      const replace = {
        ...targetBefore,
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete dataReplace.locationId;
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete replace.locationId;
      await this.postsRepository.replaceById(id, replace);
    }
    await this.postsRepository.updateById(id, dataReplace);
    const targetAfter = await this.postsRepository.findById(id);
    if (targetBefore.locationId) {
      await Promise.all([
        this.handleUpdateRanking(targetBefore.locationId, targetBefore.creatorId),
        this.bookmarkLocationHandler.update({
          userId: targetBefore.creatorId,
          locationId: targetBefore.locationId,
        }),
      ]);
    }
    if (targetAfter.locationId) {
      await Promise.all([
        this.handleUpdateRanking(targetAfter.locationId, targetAfter.creatorId),
        this.bookmarkLocationHandler.update({
          userId: targetAfter.creatorId,
          locationId: targetAfter.locationId,
        }),
      ]);
    }
    return targetAfter;
  }

  async handleUpdateRanking(locationId: number, creatorId: number): Promise<void> {
    await Promise.all([
      this.rankingLogicController.handleAccessRanking(creatorId, locationId),
      this.myMapLogicController.updateStateMyMap(creatorId, locationId),
    ]);
  }

  async addUserToReceiveNotificationList(userId: number, postId: number): Promise<number[]> {
    const targetPost = await this.postsRepository.findById(postId);
    const listUsersReceiveNotifications = (targetPost.listUsersReceiveNotifications || '')
      .split(',')
      .map((item) => Number(item));
    if (targetPost && !listUsersReceiveNotifications.includes(userId)) {
      listUsersReceiveNotifications.push(userId);
      await this.postsRepository.updateById(postId, {
        listUsersReceiveNotifications: listUsersReceiveNotifications.join(','),
      });
    }
    return listUsersReceiveNotifications;
  }

  // async removeUserToReceiveNotificationList(
  //   userId: number,
  //   postId: number,
  // ): Promise<void> {
  //   const targetPost = await this.postsRepository.findById(postId);
  //   if (targetPost) {
  //     const listUsersReceiveNotifications = (
  //       targetPost.listUsersReceiveNotifications || ''
  //     )
  //       .split(',')
  //       .map((item) => Number(item));
  //     if (listUsersReceiveNotifications.includes(userId)) {
  //       return;
  //     }
  //     const listUser = listUsersReceiveNotifications.filter(
  //       (item) => item !== userId,
  //     );
  //     await this.postsRepository.updateById(postId, {
  //       listUsersReceiveNotifications: listUser.join(','),
  //     });
  //   }
  // }

  async handleChangeCountTotalComment(postId: number, userId?: number, commentId?: number, childCommentId?: number) {
    const totalComment = await this.postsRepository.comments(postId).find();
    let count = totalComment.length;
    totalComment.map((item) => {
      count += item.totalReply || 0;
    });
    const dataPage = await this.postsRepository.page(postId);
    if (userId && userId !== dataPage?.userId && userId !== dataPage?.relatedUserId) {
      if (childCommentId) {
        const comment = await this.childCommentRepository.comment(childCommentId);
        await this.notificationLogicController.createNotification({
          listUserReceive: [comment.userId],
          notificationType: NOTIFICATION_TYPE_USER_REPLY_COMMENT,
          eventCreatorId: userId,
          targetPost: postId,
          commentId,
          childCommentId,
        });
      } else {
        const listUser = await this.addUserToReceiveNotificationList(userId, postId);
        if (commentId) {
          await this.notificationLogicController.createNotification({
            listUserReceive: listUser,
            notificationType: NOTIFICATION_TYPE_USER_COMMENT_POST,
            eventCreatorId: userId,
            targetPost: postId,
            commentId,
          });
        }
      }
    }
    await this.postsRepository.updateById(postId, {totalComment: count});
  }

  async getListPostQuery({
    userId,
    filter,
    unCheckBlock,
  }: {
    userId?: number;
    filter?: Filter<Posts>;
    unCheckBlock?: boolean;
  }): Promise<Filter<Posts>> {
    const userBlockIds = unCheckBlock ? [] : await this.usersBlockHandler.getListUserBlockIds(userId);
    return {
      ...filter,
      include: [
        ...(filter?.include ? filter?.include : []),
        {
          relation: 'mediaContents',
        },
        {
          relation: 'plan',
          scope: {
            include: [
              {
                relation: 'tasks',
                scope: {
                  order: ['taskDate ASC', 'index ASC'],
                  include: [
                    {
                      relation: 'location',
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          relation: 'location',
        },
        {
          relation: 'likes',
          scope: {
            where: {
              userId: userId,
            },
          },
        },
        {
          relation: 'bookmarks',
          scope: {
            where: {
              userId: userId,
            },
          },
        },
        {
          relation: 'rankings',
          scope: {
            where: {
              userId: userId,
            },
          },
        },
        {
          relation: 'creator',
          scope: {
            include: [
              {
                relation: 'profiles',
                scope: {
                  include: [
                    {
                      relation: 'avatars',
                      scope: {
                        include: [
                          {
                            relation: 'mediaContent',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                relation: 'page',
              },
            ],
          },
        },
        {
          relation: 'activity',
          scope: {
            include: [
              {
                relation: 'location',
              },
            ],
          },
        },
      ],
      where: {
        accessType: POST_ACCESS_TYPE_PUBLIC,
        isPublicLocation: true,
        creatorId: {
          nin: userBlockIds,
        },
        ...filter?.where,
      },
    };
  }

  async getDetailPostById(
    postId: number,
    userId: number,
    userAccess = false,
    filter?: Filter<Posts>,
  ): Promise<Partial<PostsWithRelations> | null> {
    try {
      const [userBlockIds, userFollow] = await Promise.all([
        this.usersBlockHandler.getListUserBlockIds(userId),
        this.userLogicController.listUserFollowing(userId),
      ]);
      const followIds = userFollow.map((item) => item.followingId);
      const newFilter: Filter<Posts> = {
        include: [
          {
            relation: 'mediaContents',
          },
          {
            relation: 'plan',
            scope: {
              include: [
                {
                  relation: 'tasks',
                  scope: {
                    order: ['taskDate ASC', 'index ASC'],
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'location',
          },
          {
            relation: 'activity',
            scope: {
              include: [
                {
                  relation: 'currency',
                },
                {
                  relation: 'location',
                },
              ],
            },
          },
          {
            relation: 'sourcePost',
            scope: {
              include: [
                {
                  relation: 'mediaContents',
                },
                {
                  relation: 'location',
                },
                {
                  relation: 'activity',
                  scope: {
                    include: [
                      {
                        relation: 'currency',
                      },
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
                {
                  relation: 'creator',
                  scope: userInfoQuery(userAccess),
                },
                {
                  relation: 'likes',
                  scope: {
                    where: {
                      userId: userId,
                    },
                  },
                },
                {
                  relation: 'rankings',
                  scope: {
                    where: {
                      userId: userId,
                    },
                  },
                },
              ],
              where: {
                or: [
                  {
                    accessType: POST_ACCESS_TYPE_PUBLIC,
                    creatorId: {
                      nin: userBlockIds,
                    },
                    deletedAt: null,
                  },
                  {
                    accessType: POST_ACCESS_TYPE_FOLLOW,
                    creatorId: {
                      inq: [...followIds, userId],
                    },
                    deletedAt: null,
                  },
                  {
                    accessType: POST_ACCESS_TYPE_PRIVATE,
                    creatorId: userId,
                    deletedAt: null,
                  },
                ],
              },
            },
          },
          {
            relation: 'creator',
            scope: userInfoQuery(userAccess),
          },
          {
            relation: 'likes',
            scope: {
              where: {
                userId: userId,
              },
            },
          },
          {
            relation: 'bookmarks',
            scope: {
              where: {
                userId: userId,
              },
            },
          },
          {
            relation: 'rankings',
            scope: {
              where: {
                userId: userId,
              },
            },
          },
        ],
        ...filter,
      };
      const targetPost = await this.postsRepository.findById(postId, newFilter);
      if (
        userBlockIds.includes(targetPost?.creatorId) ||
        (targetPost.accessType === POST_ACCESS_TYPE_PRIVATE && targetPost.creatorId !== userId) ||
        targetPost.deletedAt ||
        (![...followIds, userId].includes(targetPost.creatorId) && targetPost.accessType === POST_ACCESS_TYPE_FOLLOW) ||
        (targetPost.status === PostStatusEnum.draft && targetPost.postType === POST_TYPE_ACTIVITY)
      ) {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...omit(targetPost, ['location']),
        ...(targetPost.isPublicLocation || (!targetPost.isPublicLocation && userId === targetPost.creatorId)
          ? {
              location: {
                ...targetPost.location,
              },
            }
          : {}),
      };
    } catch (e) {
      return null;
    }
  }

  async find({
    userId,
    filter,
  }: {
    userId: number;
    filter?: Filter<Posts>;
  }): Promise<{
    count: number;
    data: PostDataWithFlagInterface[];
  }> {
    try {
      const newFilter = await this.getListPostQuery({
        filter,
        userId,
        unCheckBlock: true,
      });
      newFilter.where = {
        ...newFilter.where,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
        deletedAt: null,
        status: PostStatusEnum.public,
      };
      const [result, count] = await Promise.all([
        this.postsRepository.find({
          ...newFilter,
        }),
        this.postsRepository.count(newFilter.where),
      ]);
      const data = await Promise.all(result.map((postItem) => this.generateFlagPost(postItem, userId)));
      return {
        count: count.count,
        data: data,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findById({
    userId,
    id,
    filter,
  }: {
    userId: number;
    id: number;
    filter?: FilterExcludingWhere<Posts>;
  }): Promise<PostDataWithFlagInterface | null> {
    try {
      const target = await this.getDetailPostById(id, userId, false, filter).catch((e) => {
        return handleError(e);
      });
      if (target) {
        return await this.generateFlagPost(target, userId);
      } else return target;
    } catch (e) {
      return handleError(e);
    }
  }

  async updateById({id, userId, posts}: {id: number; posts: Posts; userId: number}): Promise<{message: string}> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete posts.creatorId;
      const targetPost = await this.postsRepository.findById(id);
      if (targetPost.creatorId !== userId) {
        throw new HttpErrors.Unauthorized(ErrorCode.PERMISSION_DENIED);
      }
      await this.updatePostById(id, {
        ...posts,
        creatorId: userId,
      });
      return {
        message: 'Update post success',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async search({
    postSearch,
    userId,
  }: {
    userId: number;
    postSearch: {
      q: string;
      mode: string;
      searchTypeCommunity?: string;
      offset: number;
      limit: number;
      skip: number;
      order: string[];
      where: Where<Posts>;
    };
  }): Promise<{count: number; data: PostDataWithFlagInterface[]}> {
    const mustNot: AnyObject[] = [
      {
        match: {
          status: PostStatusEnum.draft,
        },
      },
    ];
    const blockers = await this.usersBlockHandler.getListUserBlockIds(userId);
    if (blockers.length) {
      mustNot.push({
        terms: {
          creatorId: blockers,
        },
      });
    }
    const listUserFollow = await this.userLogicController.listUserFollowing(userId);
    const followIds = listUserFollow.map((item) => item.followingId);
    const where = postSearch?.where || {};
    const matchs = ELASTICwhereToMatchs(where);
    const mode =
      postSearch?.mode && postSearch?.mode === POST_SEARCH_MODE_FOLLOW
        ? POST_SEARCH_MODE_FOLLOW
        : POST_SEARCH_MODE_COMUNITY;
    const body = {
      size: postSearch?.limit,
      from: postSearch?.offset,
      sort: [
        ...(postSearch?.q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
        ...parseOrderToElasticSort(postSearch?.order || ['']),
      ],
      query: getQueryFilter(mode, matchs, followIds, mustNot),
    };
    let must: AnyObject[] = [];
    if (postSearch?.q) {
      must = getMustFilter(postSearch?.searchTypeCommunity || '', postSearch?.q, postSearch?.mode);
    }
    if (must.length) {
      body.query.bool.must = [...body.query.bool.must, ...must];
    }
    let ctrFilter: Filter<Posts>;
    let listResultId: number[] = [];
    const searchResult = await this.postsRepository.elasticService.get(body);
    if (!isEmpty(searchResult)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      listResultId = Array.from(
        searchResult.body.hits.hits,
        (item: {
          _source: {
            id: number;
          };
        }) => {
          if (item) {
            return item._source.id;
          }
        },
      );
      listResultId = listResultId.filter((item) => item);
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete postSearch?.q;
      ctrFilter = {
        ...postInfoQueryWithBookmark(true, userId, followIds),
        where: {
          id: {
            inq: listResultId,
          },
        },
      };
    } else {
      return {
        count: 0,
        data: [],
      };
    }
    const results = await this.postsRepository.find(ctrFilter);
    const count = searchResult.body.hits.total.value;
    const resultsOrdering = listResultId.length ? sortByList(results, 'id', listResultId) : results;
    const resultWithFlagIsSavedLocation = await Promise.all(
      resultsOrdering.map((item) => this.generateFlagPost(item, userId)),
    );
    return {
      count: count,
      data: resultWithFlagIsSavedLocation,
    };
  }

  async findPostByUserId({
    userId,
    id,
    filter,
  }: {
    userId: number;
    id: number;
    filter?: Filter<Posts>;
  }): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const blocked = await this.usersBlockHandler.checkBlockedByUserId(userId, id);
    if (blocked) {
      throw new HttpErrors.NotAcceptable(ErrorCode.USER_NOT_AVAILABLE);
    }
    const userFollow = await this.userLogicController.listUserFollowing(userId);
    const followIds = userFollow.map((item) => item.followingId);
    const defaultQuery = postInfoQueryWithBookmark(true, userId, followIds);
    const permission = [POST_ACCESS_TYPE_PUBLIC];
    if (followIds.includes(id)) {
      permission.push(POST_ACCESS_TYPE_FOLLOW);
    }
    if (userId === id) {
      permission.push(POST_ACCESS_TYPE_PRIVATE);
      permission.push(POST_ACCESS_TYPE_FOLLOW);
    }
    const ctrFilter: Filter<Posts> = {
      ...defaultQuery,
      ...filter,
      where: {
        accessType: {
          inq: permission,
        },
        creatorId: id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
        status: PostStatusEnum.public,
        showOnProfile: true,
      },
    };
    const [result, count] = await Promise.all([
      this.postsRepository.find({
        ...ctrFilter,
      }),
      this.postsRepository.count(ctrFilter.where),
    ]);
    const data = await Promise.all(result.map((postItem) => this.generateFlagPost(postItem, userId)));
    return {
      count: count.count,
      data,
    };
  }

  async generateFlagPost(post: Partial<PostsWithRelations>, userId: number): Promise<PostDataWithFlagInterface> {
    const mediaContents: MediaContents[] =
      post.postType === POST_TYPE_SHARE_PLAN ? (post.medias ? JSON.parse(post.medias) : []) : post.mediaContents;
    let dataSharePostSharePlan;
    let isSavedLocation = false;
    let participantCount = 0;
    let joined = false;
    if (post.locationId) {
      isSavedLocation = await this.checkLocationHadSaveToMyMap({
        userId,
        locationId: post.locationId,
      });
    }
    if (post?.activity?.id || post?.sourcePost?.activity?.id) {
      /**
       * custorm bookmark activity
       */
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      [participantCount, joined, post.bookmarks] = await Promise.all([
        this.activityParticipantRepository
          .count({
            activityId: post?.activity?.id || post?.sourcePost?.activity?.id,
            status: {
              nin: [participantStatusEnum.remove],
            },
          })
          .then((data) => data.count),
        this.activityParticipantRepository
          .findOne({
            where: {
              activityId: post?.activity?.id || post?.sourcePost?.activity?.id,
              userId,
              status: {
                nin: [participantStatusEnum.remove],
              },
            },
          })
          .then((data) => Boolean(data)),
        this.activityBookmarkRepository.find({
          where: {
            userId,
            activityId: post?.activity?.id || post?.sourcePost?.activity?.id,
          },
        }),
      ]);
    }
    if (post?.postType === POST_TYPE_SHARE_PLAN && post?.plan) {
      const tasks = post?.plan?.tasks || [];
      const locationIds = tasks.map((task) => task.locationId);
      const mateLocations = await this.materializedViewLocationsRepository.find({
        where: {
          id: {inq: locationIds},
        },
      });
      const getMediaContentsByTask = (task: Task): MediaContents[] => {
        const mateLocation = mateLocations.find((element) => element.id === task.locationId);
        const locationType = mateLocation?.locationType || LocationTypesEnum.where;
        const map = {
          [LocationTypesEnum.where.toString()]: mateLocation?.postMedias ? mateLocation.postMedias : [],
          [LocationTypesEnum.tour.toString()]: mateLocation?.tourMedias ? mateLocation.tourMedias : [],
          [LocationTypesEnum.food.toString()]: mateLocation?.backgroundMedia ? [mateLocation.backgroundMedia] : [],
          [LocationTypesEnum.stay.toString()]: mateLocation?.backgroundMedia ? [mateLocation.backgroundMedia] : [],
        };
        return map[locationType];
      };
      const tasksIncludeMedias = await Promise.all(
        tasks.map(async (task: TaskWithRelations) => {
          // eslint-disable-next-line no-shadow
          const mediaContents = getMediaContentsByTask(task);
          return {...task, mediaContents};
        }),
      );
      Object.assign(post?.plan?.tasks, tasksIncludeMedias);
    }
    if (post?.postType === POST_TYPE_SHARED && post?.sourcePost) {
      const blocked = await this.usersBlockHandler.checkBlockedByUserId(userId, post?.sourcePost?.creatorId);
      if (blocked) {
        delete post.sourcePost;
      } else {
        if (post?.sourcePost?.postType === POST_TYPE_SHARE_PLAN && post?.sourcePost?.planId) {
          dataSharePostSharePlan = await this.planLogicController.findById({
            userId,
            id: post?.sourcePost?.planId,
          });
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
      ...omit(post, ['likes', 'bookmarks', 'rankings']),
      mediaContents,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      creator: this.usersRepository.convertDataUser(post.creator),
      ...(post.sourcePost
        ? {
            sourcePost: {
              ...post.sourcePost,
              creator: this.usersRepository.convertDataUser(post.sourcePost.creator),
              mediaContents: post.sourcePost.medias ? JSON.parse(post.sourcePost.medias) : [],
              ...(post?.sourcePost?.activity?.id
                ? {
                    activity: {
                      ...post?.sourcePost?.activity,
                      participantCount,
                      joined,
                    },
                  }
                : {}),
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              ...(post?.sourcePost?.location
                ? {
                    location: {
                      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                      // @ts-ignore
                      ...post?.sourcePost?.location,
                      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                      // @ts-ignore
                      name: post?.sourcePost?.location.name,
                    },
                  }
                : {}),
              metadata: {
                ...post.sourcePost.metadata,
                ...(dataSharePostSharePlan
                  ? {
                      plan: {
                        tasks: dataSharePostSharePlan.tasks || [],
                        planName: dataSharePostSharePlan.planName,
                        startDate: dataSharePostSharePlan.startDate,
                        endDate: dataSharePostSharePlan.endDate,
                      },
                    }
                  : {}),
              },
            },
          }
        : {}),
      ...(post.plan
        ? {
            metadata: {
              ...post.metadata,
              plan: {
                tasks: post.plan.tasks || [],
                planName: post.plan.planName,
                startDate: post.plan.startDate,
                endDate: post.plan.endDate,
              },
            },
          }
        : {}),
      ...(post.location
        ? {
            location: {
              ...post.location,
              name: post.location.name,
            },
          }
        : {}),
      ...(post?.activity?.id
        ? {
            activity: {
              ...post?.activity,
              participantCount,
              joined,
            },
          }
        : {}),
      liked: Boolean(post.likes && post.likes.length),
      marked: Boolean(post.bookmarks && post.bookmarks.length),
      rated: Boolean(post.rankings && post.rankings.length),
      isSavedLocation,
    };
  }

  async checkLocationHadSaveToMyMap({locationId, userId}: {locationId: number; userId: number}): Promise<boolean> {
    const myLocations = await this.myMapLogicController.getMyLocationByLocationIdvsUserId({
      locationId,
      userId,
    });
    return !!myLocations;
  }
}

const getMustFilter = (searchType: string, q: string, mode: string): AnyObject[] => {
  let must: AnyObject[] = [];
  if (mode === POST_SEARCH_MODE_COMUNITY) {
    if (searchType === SEARCH_TYPE_COMMUNITY_LOCATION) {
      must = [
        ...must,
        {
          multi_match: {
            query: changeAlias(q).trim(),
            operator: 'and',
            fields: ['location.name'],
          },
        },
        {
          match: {
            isPublicLocation: true,
          },
        },
        {
          exists: {
            field: 'locationId',
          },
        },
      ];
    }
    if (searchType === SEARCH_TYPE_COMMUNITY_POST) {
      must = [
        ...must,
        {
          multi_match: {
            query: changeAlias(q).trim(),
            operator: 'and',
            fields: ['content'],
          },
        },
      ];
    }
  } else {
    must = [
      ...must,
      {
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['location.name', 'location.formatedAddress'],
        },
      },
    ];
  }
  return must;
};

const getQueryFilter = (mode: string, matchs: AnyObject[], followIds: number[], mustNot?: AnyObject[]): AnyObject => {
  return {
    bool:
      mode === POST_SEARCH_MODE_COMUNITY
        ? {
            must: [
              {
                match: {
                  accessType: POST_ACCESS_TYPE_PUBLIC,
                },
              },
              {
                bool: {
                  should: [
                    {
                      match: {
                        postType: POST_TYPE_CREATED,
                      },
                    },
                    {
                      match: {
                        postType: POST_TYPE_PAGE,
                      },
                    },
                    {
                      match: {
                        postType: POST_TYPE_MY_MAP,
                      },
                    },
                    {
                      bool: {
                        must: [
                          {
                            match: {
                              postType: POST_TYPE_SHARE_PLAN,
                            },
                          },
                          {
                            match: {
                              isPublicPlan: true,
                            },
                          },
                        ],
                      },
                    },
                    {
                      match: {
                        postType: POST_TYPE_ACTIVITY,
                      },
                    },
                  ],
                },
              },
              ...matchs,
            ],
            must_not: mustNot,
          }
        : {
            must: [
              ...matchs,
              {
                bool: {
                  should: [
                    {
                      bool: {
                        must: [
                          {
                            match: {
                              accessType: POST_ACCESS_TYPE_PUBLIC,
                            },
                          },
                          {
                            terms: {
                              creatorId: followIds,
                            },
                          },
                        ],
                      },
                    },
                    {
                      bool: {
                        must: [
                          {
                            match: {
                              accessType: POST_ACCESS_TYPE_FOLLOW,
                            },
                          },
                          {
                            terms: {
                              creatorId: followIds,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            must_not: mustNot,
          },
  };
};
