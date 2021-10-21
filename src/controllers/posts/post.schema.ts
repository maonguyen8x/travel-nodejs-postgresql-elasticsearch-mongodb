import {getModelSchemaRef} from '@loopback/openapi-v3';
import {POST_ACCESS_TYPE_FOLLOW, POST_ACCESS_TYPE_PRIVATE, POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import {Activity, Currency, Locations, MediaContents, Posts, Task} from '../../models';
import {userInfoQuery, userInfoSchema} from '../specs/user-controller.specs';

export function postInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Posts, {
        exclude: ['listUsersReceiveNotifications', 'metadata', 'activity'],
        title: 'contentPost',
      }).definitions.contentPost.properties,
      metadata: {
        type: 'object',
        properties: {
          hadCameLocations: {
            type: 'array',
            items: getModelSchemaRef(Locations),
          },
          plan: {
            type: 'object',
            properties: {
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Task, {
                      title: 'PlanTasks',
                    }).definitions['PlanTasks'].properties,
                    location: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Locations, {
                          title: 'TaskLocation',
                        }).definitions['TaskLocation'].properties,
                      },
                    },
                    mediaContents: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
                        },
                      },
                    },
                  },
                },
              },
              planName: {
                type: 'string',
              },
              startDate: {
                type: 'string',
              },
              endDate: {
                type: 'string',
              },
            },
          },
          color: {
            type: 'string',
          },
        },
      },
      location: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
        },
      },
      activity: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Activity).definitions.Activity.properties,
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
          currency: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Currency).definitions.Currency.properties,
            },
          },
          joined: {
            type: 'boolean',
          },
          participantCount: {
            type: 'number',
          },
        },
      },
      mediaContents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
          },
        },
      },
      sourcePost: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Posts).definitions.Posts.properties,
          location: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Locations).definitions.Locations.properties,
            },
          },
          activity: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Activity).definitions.Activity.properties,
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
              currency: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(Currency).definitions.Currency.properties,
                },
              },
              joined: {
                type: 'boolean',
              },
              participantCount: {
                type: 'number',
              },
            },
          },
          metadata: {
            type: 'object',
            properties: {
              hadCameLocations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Locations).definitions.Locations.properties,
                  },
                },
              },
              plan: {
                type: 'object',
                properties: {
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Task, {
                          title: 'PlanTasks',
                        }).definitions['PlanTasks'].properties,
                        location: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Locations, {
                              title: 'TaskLocation',
                            }).definitions['TaskLocation'].properties,
                          },
                        },
                        mediaContents: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
                            },
                          },
                        },
                      },
                    },
                  },
                  planName: {
                    type: 'string',
                  },
                  startDate: {
                    type: 'string',
                  },
                  endDate: {
                    type: 'string',
                  },
                },
              },
              color: {
                type: 'string',
              },
            },
          },
          mediaContents: {
            type: 'array',
            items: getModelSchemaRef(MediaContents),
          },
          creator: userInfoSchema(),
        },
      },
      creator: userInfoSchema(),
      liked: {
        type: 'boolean',
      },
      marked: {
        type: 'boolean',
      },
      rated: {
        type: 'boolean',
      },
      isSavedLocation: {
        type: 'boolean',
      },
    },
  };
}

export function postInfoQueryWithBookmark(permission = true, userId: number, listUserFollowingId: number[] = []) {
  return {
    include: [
      {
        relation: 'mediaContents',
      },
      {
        relation: 'location',
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
              scope: userInfoQuery(permission),
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
                deletedAt: null,
              },
              {
                accessType: POST_ACCESS_TYPE_FOLLOW,
                creatorId: {
                  inq: [...listUserFollowingId, userId],
                },
                deletedAt: null,
              },
              {
                accessType: POST_ACCESS_TYPE_PRIVATE,
                deletedAt: null,
                creatorId: userId,
              },
            ],
          },
        },
      },
      {
        relation: 'creator',
        scope: userInfoQuery(permission),
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
    where: {
      accessType: POST_ACCESS_TYPE_PUBLIC,
      deletedAt: null,
    },
  };
}

export function postInfoQueryForBookmark(permission = true, userId: number) {
  return {
    include: [
      {
        relation: 'mediaContents',
      },
      {
        relation: 'location',
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
              relation: 'sourcePost',
            },
            {
              relation: 'creator',
              scope: userInfoQuery(permission, userId),
            },
            {
              relation: 'likes',
              scope: {
                where: {
                  userId: userId,
                },
              },
            },
          ],
        },
      },
      {
        relation: 'creator',
        scope: userInfoQuery(permission, userId),
      },
      {
        relation: 'likes',
        scope: {
          where: {
            userId: userId,
          },
        },
      },
    ],
  };
}
