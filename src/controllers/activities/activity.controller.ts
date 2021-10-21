import {AnyObject, Filter, FilterExcludingWhere} from '@loopback/repository';
import {del, get, getModelSchemaRef, getWhereSchemaFor, param, patch, post, requestBody} from '@loopback/rest';
import {Activity, ActivityParticipant, Currency, Follow, Locations, MediaContents} from '../../models';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {ActivityHandler} from './activity.handler';
import {
  CreateActivityRequestInterface,
  ActivityDetailResponseInterface,
  ActivityParticipantResponseInterface,
} from './activity.constant';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {userInfoSchema} from '../specs/user-controller.specs';
import {FilterFollowersInterface} from '../follows/follow-interface';
import {getActivityPostSchema} from './activity.schema';

export class ActivityController {
  constructor(
    @inject(HandlerBindingKeys.ACTIVITIES_HANDLER)
    public activityHandler: ActivityHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/activities', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Activity model instance',
        content: {'application/json': {schema: getModelSchemaRef(Activity)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'NewActivity',
            properties: {
              ...getModelSchemaRef(Activity, {
                title: 'NewActivityExclude',
                exclude: ['id', 'status', 'postId', 'createdById', 'createdAt', 'deletedAt', 'updatedAt'],
              }).definitions.NewActivityExclude.properties,
              introduction: {
                type: 'string',
              },
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
              showOnProfile: {
                type: 'boolean',
              },
            },
          },
        },
      },
    })
    activity: CreateActivityRequestInterface,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Activity> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.create(activity, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/activities', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Activity model instances',
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
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(Activity, {
                        title: 'NewActivityExclude',
                      }).definitions.NewActivityExclude.properties,
                      location: getModelSchemaRef(Locations, {
                        exclude: [
                          'id',
                          'name',
                          'createdAt',
                          'deletedAt',
                          'averagePoint',
                          'totalReview',
                          'updatedAt',
                          'userId',
                          'status',
                        ],
                      }),
                      introduction: {
                        type: 'string',
                      },
                      currency: getModelSchemaRef(Currency),
                      mediaContents: {
                        type: 'array',
                        items: getModelSchemaRef(MediaContents),
                      },
                      post: getActivityPostSchema(),
                      joined: {
                        type: 'boolean',
                      },
                      participantCount: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'activitySearch',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              coordinates: {
                type: 'string',
              },
              distance: {
                type: 'number',
              },
              dateSearch: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    activitySearch: {
      q: string;
      coordinates: string;
      distance: number;
      dateSearch: string;
    },
    @param.filter(Activity, {
      name: 'filterActivity',
    })
    filter?: Filter<Activity>,
  ): Promise<{
    count: number;
    data: ActivityDetailResponseInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.find({filter, userId, activitySearch});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/activities/{activityId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Activity model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              title: 'ActivityDetail',
              properties: {
                ...getModelSchemaRef(Activity, {
                  title: 'NewActivityExclude',
                }).definitions.NewActivityExclude.properties,
                location: getModelSchemaRef(Locations, {
                  exclude: [
                    'id',
                    'name',
                    'createdAt',
                    'deletedAt',
                    'averagePoint',
                    'totalReview',
                    'updatedAt',
                    'userId',
                    'status',
                  ],
                }),
                introduction: {
                  type: 'string',
                },
                mediaContents: {
                  type: 'array',
                  items: getModelSchemaRef(MediaContents),
                },
                post: getActivityPostSchema(),
                currency: getModelSchemaRef(Currency),
                showOnProfile: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('activityId') activityId: number,
    @param.filter(Activity, {exclude: 'where', name: 'filterActivityById'})
    filter?: FilterExcludingWhere<Activity>,
  ): Promise<ActivityDetailResponseInterface> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.findById({
      id: activityId,
      filter,
      userId,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @patch('/activities/{activityId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Activity PATCH success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                mesage: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('activityId') activityId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdateActivity',
            properties: {
              ...getModelSchemaRef(Activity, {
                title: 'NewActivityExclude',
                exclude: ['status', 'createdById', 'createdAt', 'deletedAt', 'updatedAt'],
              }).definitions.NewActivityExclude.properties,
              location: getModelSchemaRef(Locations, {
                exclude: [
                  'id',
                  'createdAt',
                  'deletedAt',
                  'averagePoint',
                  'totalReview',
                  'updatedAt',
                  'userId',
                  'status',
                  'locationType',
                ],
              }),
              introduction: {
                type: 'string',
              },
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  exclude: ['postId', 'deletedAt'],
                }),
              },
            },
          },
        },
      },
    })
    activity: CreateActivityRequestInterface,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.updateById({activityId, activity, userId});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/activities/{activityId}/join', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Activity model instance',
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
  async joinActivity(
    @param.path.number('activityId') activityId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.joinActivity(activityId, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/activities/{activityId}/left', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Activity model instance',
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
  async leftActivity(
    @param.path.number('activityId') activityId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.leftActivity(activityId, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/activities/{activityId}/participants', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Activity model instances',
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
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(ActivityParticipant).definitions.ActivityParticipant.properties,
                      user: {
                        ...userInfoSchema(),
                        properties: {
                          ...userInfoSchema().properties,
                          followed: {
                            type: 'boolean',
                          },
                          followStatus: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async findParticipant(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('activityId') activityId: number,
    @param({
      name: 'activityParticipantSearch',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    activityParticipantSearch?: {
      q?: string;
    },
    @param.filter(ActivityParticipant, {
      name: 'filterActivityParticipant',
    })
    filter?: Filter<ActivityParticipant>,
  ): Promise<{
    count: number;
    data: ActivityParticipantResponseInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.findParticipant({
      filter,
      userId,
      activityId,
      activityParticipantSearch,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/activities/{activityId}/invitees', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Activity model instances',
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
                    type: 'object',
                    properties: {
                      ...userInfoSchema().properties,
                      followed: {
                        type: 'boolean',
                      },
                      followStatus: {
                        type: 'string',
                      },
                      inviteStatus: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async findInviteeWithFollowings(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('activityId') activityId: number,
    @param({
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
      name: 'filterFollowers',
    })
    filter: FilterFollowersInterface,
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.findInviteeWithFollowings({
      userId,
      activityId,
      filter,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/activities/{activityId}/invite', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Activity model instance',
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
  async inviteJoinActivity(
    @param.path.number('activityId') activityId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'listUserInviteActivity',
            properties: {
              listUser: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    })
    listUserInviteActivity: {
      listUser: number[];
    },
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    const {listUser} = listUserInviteActivity;
    return this.activityHandler.inviteJoinActivity({
      activityId,
      userId,
      listUser,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/activities/{activityId}/remove', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Activity model instance',
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
  async removeUserActivity(
    @param.path.number('activityId') activityId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'listUserRemoveActivity',
            properties: {
              listUser: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    })
    listUserRemoveActivity: {
      listUser: number[];
    },
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    const {listUser} = listUserRemoveActivity;
    return this.activityHandler.removeUserActivity({
      activityId,
      userId,
      listUser,
    });
  }

  @patch('/activities/remind-coming-soon', {
    responses: {
      '204': {
        description: 'Activity model instance',
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
  async remindActivity(): Promise<{message: string}> {
    await this.activityHandler.remindActivity();
    return {
      message: 'successful',
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/activity/{activityId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Delete activity by id',
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
  async deleteById(
    @param.path.number('activityId') activityId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityHandler.deleteById(activityId, userId);
  }
}
