import {Filter} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {Activity, ActivityBookmark, Currency, Locations, MediaContents} from '../../models';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {inject} from '@loopback/context';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {ActivityBookmarkHandler} from './activity-bookmark.handler';
import {ActivityBookmarkDetail} from './activity-bookmark.constant';
import {getActivityPostSchema} from '../activities/activity.schema';

export class ActivityBookmarkController {
  constructor(
    @inject(HandlerBindingKeys.ACTIVITY_BOOKMARK_HANDLER)
    public activityBookmarkHandler: ActivityBookmarkHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/activity-bookmarks', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'ActivityBookmark model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(ActivityBookmark)},
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              activityId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    activityBookmark: {
      activityId: number;
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<ActivityBookmark> {
    const userId = parseInt(userProfile[securityId]);
    const {activityId} = activityBookmark;
    return this.activityBookmarkHandler.create({activityId, userId});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/activity-bookmarks', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of ActivityBookmark model instances',
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
                      ...getModelSchemaRef(ActivityBookmark).definitions.ActivityBookmark.properties,
                      activity: {
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
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(ActivityBookmark, {name: 'filterActivityBookmark'})
    filter?: Filter<ActivityBookmark>,
  ): Promise<{
    data: ActivityBookmarkDetail[];
    count: number;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.activityBookmarkHandler.find({filter, userId});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/activity-bookmarks/{bookmarkId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'ActivityBookmark DELETE success',
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
  async deleteById(
    @param.path.number('bookmarkId') bookmarkId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<void> {
    const userId = parseInt(userProfile[securityId]);
    await this.activityBookmarkHandler.deleteById({bookmarkId, userId});
  }
}
