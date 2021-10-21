import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Filter} from '@loopback/repository';
import {get, getModelSchemaRef, getWhereSchemaFor, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {FollowsLogicController} from '..';

import {Follow, Users} from '../../models';

import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {userInfoQuery, userInfoSchema} from '../specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {FilterFollowersInterface} from './follow-interface';

const paramSpec = {
  in: 'query',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          q: {
            type: 'string',
          },
          offset: {
            type: 'number',
          },
          limit: {
            type: 'number',
          },
          skip: {
            type: 'number',
          },
          order: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          where: getWhereSchemaFor(Follow),
        },
      },
    },
  },
};
export class FollowController {
  constructor(
    @inject('controllers.FollowsLogicController')
    public followsLogicController: FollowsLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/follows', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Follow model instance',
        content: {'application/json': {schema: getModelSchemaRef(Follow)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Follow> {
    const userId = parseInt(userProfile[securityId]);
    return this.followsLogicController.create(userId, id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/followers', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Follow model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: {
                    ...followInfoSchema(),
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async followers(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
    // filterFollowers
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    @param({
      ...paramSpec,
      name: 'filterFollowers',
    })
    filter: FilterFollowersInterface,
  ): Promise<{count: number; data: AnyObject[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.followsLogicController.followers(userId, id, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/followings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Following of user with id',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: {
                    ...followInfoSchema(),
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async followings(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
    //filterFollowers
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    @param({
      ...paramSpec,
      name: 'filterFollowing',
    })
    filter: FilterFollowersInterface,
  ): Promise<{count: number; data: AnyObject[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.followsLogicController.followings(userId, id, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/list-request-follow', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Following of user with id',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: {
                    ...followInfoSchema(),
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async listUserRequestFollow(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    //filterListRequestFollow
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    @param({
      ...paramSpec,
      name: 'filterListRequestFollow',
    })
    filter: FilterFollowersInterface,
  ): Promise<{count: number; data: AnyObject[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.followsLogicController.listUserRequestFollow(userId, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/unfollow', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes comment by id',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async unFollow(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.followsLogicController.unFollow(userId, id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/remove-follower', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes comment by id',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async removeFollower(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') targetUserId: number,
  ): Promise<{message: string}> {
    const followingId = parseInt(userProfile[securityId]);
    return this.followsLogicController.removeFollower(targetUserId, followingId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/accept-follower', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Accept follow',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async acceptFollow(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{message: string}> {
    const userId = id;
    const followingId = parseInt(userProfile[securityId]);
    return this.followsLogicController.acceptFollow(userId, followingId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/list-matching-following', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Following of user with id',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: {
                    ...followInfoSchema(),
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async listUserMatchingFollowing(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'matchingFollowSearch',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              recently: {
                type: 'boolean',
              },
            },
          },
        },
      },
    })
    matchingFollowSearch: {
      q?: string;
      recently?: boolean;
    },
    @param.filter(Follow, {name: 'filterMatchingFollowing'})
    filter: Filter<Follow>,
  ): Promise<{count: number; data: Users[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.followsLogicController.getListMatchingUserFlowingByUserId(userId, filter, matchingFollowSearch);
  }
}

export function followInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...userInfoSchema().properties,
      followed: {
        type: 'boolean',
      },
      followStatus: {
        type: 'string',
      },
    },
  };
}

export function userInfoQueryWithFlagFollow(permission = true, userId: number) {
  return {
    include: [
      ...userInfoQuery(permission, userId).include,
      {
        relation: 'following',
        scope: {
          where: {
            userId,
          },
        },
      },
    ],
  };
}
