// Uncomment these imports to begin using these cool features!

import {AnyObject, Filter, repository} from '@loopback/repository';
import {ConversationRepository, FollowRepository, UsersRepository} from '../../repositories';
import {changeAlias, parseOrderToElasticSort} from '../../utils/handleString';
import {
  FOLLOW_STATUS_ACCEPTED,
  FOLLOW_STATUS_REQUESTED,
  HAS_NOT_FOLLOWED_YOU,
  HAVE_BEEN_FOLLOWING,
  HAVE_NOT_FOLLOWED,
} from '../../configs/follow-constants';
import {Follow, Users, UsersWithRelations} from '../../models';
import {userInfoQueryWithFlagFollow} from './follow.controller';
import {inject} from '@loopback/context';
import {NotificationLogicController} from '..';
import {HttpErrors} from '@loopback/rest';
import {
  NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW,
  NOTIFICATION_TYPE_USER_FOLLOW,
} from '../../configs/notification-constants';
import {FilterFollowersInterface} from './follow-interface';
import {compare} from '../../utils/Array';
import _, {isEmpty} from 'lodash';
import {USER_TYPE_ACCESS_PAGE} from '../../configs/user-constants';
import {ElasticSearchResultHitInterface, ELASTICwhereToMatchs, getHit} from '../../configs/utils-constant';

export class FollowsLogicController {
  constructor(
    @repository(FollowRepository)
    public followRepository: FollowRepository,
    @repository(ConversationRepository)
    public conversationRepository: ConversationRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
  ) {}

  async create(userId: number, followingUserId: number): Promise<Follow> {
    const follow = await this.followRepository.find({
      where: {
        userId: userId,
        followingId: followingUserId,
      },
    });
    if (follow?.length) {
      throw new HttpErrors.BadRequest(HAVE_BEEN_FOLLOWING);
    }
    const followingUser = await this.usersRepository.findById(followingUserId);

    const result = await this.followRepository.create({
      userId,
      followingId: followingUserId,
      followStatus:
        followingUser.userTypeAccess === USER_TYPE_ACCESS_PAGE ? FOLLOW_STATUS_ACCEPTED : FOLLOW_STATUS_REQUESTED,
    });
    await this.updateUserFollowCount(userId, followingUserId);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [followingUserId],
      notificationType: NOTIFICATION_TYPE_USER_FOLLOW,
      eventCreatorId: userId,
    });
    return result;
  }

  async followers(
    userId: number,
    targetUserId: number,
    filter: FilterFollowersInterface,
  ): Promise<{count: number; data: AnyObject[]}> {
    let listId: number[];
    let count: number;
    if (filter?.q) {
      const listUserId = await this.followRepository.getListFollowerById(targetUserId);
      const searchData = await this.handleSearchUser(filter, filter?.q, listUserId);
      count = searchData.count;
      listId = searchData.listUserId;
    } else {
      listId = await this.followRepository.getListFollowerById(targetUserId);
      count = (
        await this.usersRepository.count({
          id: {
            inq: [...listId],
          },
        })
      ).count;
    }
    const data = await this.usersRepository.find({
      ...userInfoQueryWithFlagFollow(true, userId),
      where: {
        id: {
          inq: [...listId],
        },
      },
    });
    const dataOrdering = data
      .map((item) => {
        return {
          ...item,
          key: listId.findIndex((key) => key === item.id),
        };
      })
      .sort((a, b) => {
        return compare(a, b, 'key');
      });
    return {
      count: count,
      data: dataOrdering.map((item) => {
        const newItem = {
          ...item,
          followed: false,
          followStatus: '',
        };
        if (item.following && item.following.length) {
          newItem.followed = true;
          newItem.followStatus = item.following[0].followStatus || '';
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          delete newItem.following;
        }
        return newItem;
      }),
    };
  }

  async updateUserFollowCount(userId: number, followingId: number) {
    // update totalFollower
    const countFollower = await this.followRepository.count({
      followingId: followingId,
      followStatus: FOLLOW_STATUS_ACCEPTED,
    });

    await this.usersRepository.updateById(followingId, {
      totalFollower: countFollower.count,
    });

    // update totalFollowing
    const countFollowing = await this.followRepository.count({
      userId: userId,
      followStatus: FOLLOW_STATUS_ACCEPTED,
    });

    await this.usersRepository.updateById(userId, {
      totalFollowing: countFollowing.count,
    });
  }

  async followings(
    userId: number,
    targetUserId: number,
    filter: FilterFollowersInterface,
  ): Promise<{count: number; data: AnyObject[]}> {
    let listId: number[];
    let count: number;
    if (filter?.q) {
      const listUserId = await this.followRepository.getListFollowingById(targetUserId);
      const searchData = await this.handleSearchUser(filter, filter?.q, listUserId);
      count = searchData.count;
      listId = searchData.listUserId;
    } else {
      listId = await this.followRepository.getListFollowingById(targetUserId);
      count = (
        await this.usersRepository.count({
          id: {
            inq: [...listId],
          },
        })
      ).count;
    }
    const data = await this.usersRepository.find({
      ...userInfoQueryWithFlagFollow(true, userId),
      where: {
        id: {
          inq: [...listId],
        },
      },
    });
    const dataOrdering = data
      .map((item) => {
        return {
          ...item,
          key: listId.findIndex((key) => key === item.id),
        };
      })
      .sort((a, b) => {
        return compare(a, b, 'key');
      });
    return {
      count: count,
      data: dataOrdering.map((item) => {
        const newItem = {
          ...item,
          followed: false,
          followStatus: '',
        };
        if (item.following && item.following.length) {
          newItem.followed = true;
          newItem.followStatus = item.following[0].followStatus || '';
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          delete newItem.following;
        }
        return newItem;
      }),
    };
  }

  async listUserRequestFollow(
    userId: number,
    filter: FilterFollowersInterface,
  ): Promise<{count: number; data: AnyObject[]}> {
    let listId: number[];
    let count: number;
    if (filter?.q) {
      const listFollow = await this.followRepository.find({
        where: {
          followingId: userId,
          followStatus: FOLLOW_STATUS_REQUESTED,
        },
      });
      const listUserId = listFollow.map((item) => item.userId);
      const searchData = await this.handleSearchUser(filter, filter?.q, listUserId);
      count = searchData.count;
      listId = searchData.listUserId;
    } else {
      const [listFollow, listFollowWithoutFilter] = await Promise.all([
        this.followRepository.find({
          ...filter,
          where: {
            followingId: userId,
            followStatus: FOLLOW_STATUS_REQUESTED,
          },
        }),
        this.followRepository.find({
          where: {
            followingId: userId,
            followStatus: FOLLOW_STATUS_REQUESTED,
          },
        }),
      ]);
      listId = listFollow.map((item) => item.userId);
      const listIdWithoutFilter = listFollowWithoutFilter.map((item) => item.userId);
      count = (
        await this.usersRepository.count({
          id: {
            inq: [...listIdWithoutFilter],
          },
        })
      ).count;
    }
    const data = await this.usersRepository.find({
      ...userInfoQueryWithFlagFollow(true, userId),
      where: {
        id: {
          inq: listId,
        },
      },
    });

    const dataOrdering = data
      .map((item) => {
        return {
          ...item,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          key: listId.findIndex((key) => key === item.id),
        };
      })
      .sort((a, b) => {
        return compare(a, b, 'key');
      });

    return {
      count: count,
      data: dataOrdering.map((item) => {
        const newItem = {
          ...item,
          followed: false,
          followStatus: '',
        };
        if (item.following && item.following.length) {
          newItem.followed = true;
          newItem.followStatus = item.following[0].followStatus || '';
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          delete newItem.following;
        }
        return newItem;
      }),
    };
  }

  async unFollow(userId: number, followingId: number): Promise<{message: string}> {
    const target = await this.followRepository.findOne({
      where: {
        userId,
        followingId,
      },
    });
    if (!target) {
      throw new HttpErrors.BadRequest(HAVE_NOT_FOLLOWED);
    }
    await this.followRepository.deleteById(target.id);
    await this.updateUserFollowCount(userId, followingId);
    return {
      message: 'Unfollow successful',
    };
  }

  async removeFollower(userId: number, followingId: number): Promise<{message: string}> {
    const target = await this.followRepository.findOne({
      where: {
        userId,
        followingId,
      },
    });
    if (!target) {
      throw new HttpErrors.BadRequest(HAS_NOT_FOLLOWED_YOU);
    }
    await this.followRepository.deleteById(target.id);
    await this.updateUserFollowCount(userId, followingId);
    return {
      message: 'Remove follower successful',
    };
  }

  async acceptFollow(userId: number, followingId: number): Promise<{message: string}> {
    const target = await this.followRepository.findOne({
      where: {
        userId,
        followingId,
        followStatus: FOLLOW_STATUS_REQUESTED,
      },
    });
    if (!target) {
      throw new HttpErrors.BadRequest(HAS_NOT_FOLLOWED_YOU);
    }
    await this.followRepository.updateById(target.id, {
      followStatus: FOLLOW_STATUS_ACCEPTED,
    });
    await this.updateUserFollowCount(userId, followingId);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [userId],
      notificationType: NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW,
      eventCreatorId: followingId,
    });
    return {
      message: 'Accept follow successful',
    };
  }

  async handleSearchUser(
    filter: AnyObject,
    q: string,
    listUserId: number[],
  ): Promise<{
    count: number;
    listUserId: number[];
  }> {
    const must: AnyObject[] = [
      {
        terms: {
          id: listUserId,
        },
      },
    ];
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['name'],
        },
      });
    }
    const body: AnyObject = {
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
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
        ...parseOrderToElasticSort(filter?.order || ['']),
      ],
      query: {
        bool: {
          must: must,
        },
      },
    };
    let listResultId: number[] = [];
    let count = 0;
    let result: AnyObject;
    // eslint-disable-next-line prefer-const
    result = await this.usersRepository.elasticService.get(body);

    if (!isEmpty(result)) {
      count = result.body.hits.total.value;
      listResultId = Array.from(
        result.body.hits.hits,
        (item: {
          _source: {
            id: number;
          };
        }) => {
          if (item?._source?.id) {
            return item._source.id;
          } else {
            return 0;
          }
        },
      ).filter((item) => item);
    }

    return {
      count: count,
      listUserId: listResultId,
    };
  }

  async getListMatchingUserFlowingByUserId(
    userId: number,
    filter: Filter<Follow>,
    matchingFollowSearch: {
      q?: string;
      recently?: boolean;
    },
  ): Promise<{
    count: number;
    data: Users[];
  }> {
    let count = 0;
    let data: UsersWithRelations[] = [];
    const listUserIdFollowing = (
      await this.followRepository.find({
        fields: {
          followingId: true,
        },
        where: {
          userId,
          followStatus: FOLLOW_STATUS_ACCEPTED,
        },
      })
    ).map((item) => item.followingId);
    let listMatchFollowUserId = (
      await this.followRepository.find({
        fields: {
          userId: true,
        },
        where: {
          userId: {
            inq: listUserIdFollowing,
          },
          followingId: userId,
          followStatus: FOLLOW_STATUS_ACCEPTED,
        },
      })
    ).map((item) => item.userId);
    const where = {
      id: {
        inq: listMatchFollowUserId,
      },
    };
    const matchs = ELASTICwhereToMatchs({
      ...where,
    });
    if (matchingFollowSearch?.q?.length) {
      matchs.push({
        multi_match: {
          query: changeAlias(matchingFollowSearch?.q).trim(),
          operator: 'and',
          fields: ['name', 'username', 'email.email'],
        },
      });
    }
    const body: AnyObject = {
      sort: [
        ...(matchingFollowSearch?.q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
        ...parseOrderToElasticSort(filter?.order || ['']),
      ],
      _source: ['id'],
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: matchs,
        },
      },
    };
    const searchResult = listMatchFollowUserId.length > 0 ? await this.usersRepository.elasticService.get(body) : [];
    if (!isEmpty(searchResult)) {
      count = _.get(searchResult, 'body.hits.total.value', 0);
      const hit = getHit(searchResult);
      listMatchFollowUserId = Array.from(hit, (item: ElasticSearchResultHitInterface) =>
        _.get(item, '_source.id'),
      ).filter((item) => item);
      data = await this.usersRepository.find({
        ...userInfoQueryWithFlagFollow(true, userId),
        where: {
          id: {
            inq: [...listMatchFollowUserId],
          },
        },
      });
    } else {
      count = listMatchFollowUserId.length;
      data = await this.usersRepository.find({
        ...userInfoQueryWithFlagFollow(true, userId),
        ...filter,
        where: {
          id: {
            inq: [...listMatchFollowUserId],
          },
        },
      });
    }
    if (matchingFollowSearch?.recently && JSON.parse(String(matchingFollowSearch?.recently).toLowerCase())) {
      const top10conversationNewest = await this.conversationRepository.find({
        order: ['updatedAt DESC'],
        limit: 10,
        where: {
          accessRead: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            elemMatch: {
              userId,
            },
          },
        },
      });
      const userIds = _.uniq(
        // eslint-disable-next-line prefer-spread
        [].concat
          .apply(
            [],
            top10conversationNewest.map((item: any) => item.participants),
          )
          .map((item: any) => item.userId),
      );
      const listFriendInConversation = data.filter((item) => userIds.includes(item.id));
      const listNoFriendInConversation = data.filter((item) => !userIds.includes(item.id));
      data = [...listFriendInConversation, ...listNoFriendInConversation];
    }

    return {
      count,
      data,
    };
  }
}
