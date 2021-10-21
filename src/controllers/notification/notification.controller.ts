import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {NOTIFICATION_STATUS_READ} from '../../configs/notification-constants';
import {
  Activity,
  Booking,
  ChildComment,
  Comments,
  LocationRequests,
  MediaContents,
  Notification,
  NotificationMetadata,
  Page,
  Posts,
  Rankings,
  ReplyRanking,
  Service,
} from '../../models';
import {NotificationRepository, UsersRepository} from '../../repositories';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {userInfoQuery, userInfoSchema} from '../specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {NotificationLogicController} from './notification-logic.controller';
import {handleError} from '../../utils/handleError';

export class NotificationController {
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/notifications', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Notification model instance',
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
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              listUserReceive: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
              notificationType: {
                type: 'string',
              },
              pageId: {
                type: 'number',
              },
              commentId: {
                type: 'number',
              },
              childCommentId: {
                type: 'number',
              },
              rankingId: {
                type: 'number',
              },
              replyRankingId: {
                type: 'number',
              },
              conversationId: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    notification: {
      listUserReceive: number[];
      notificationType: string;
      pageId?: number;
      commentId?: number;
      childCommentId?: number;
      rankingId?: number;
      replyRankingId?: number;
      conversationId?: string;
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{
    message: string;
  }> {
    const eventCreatorId = parseInt(userProfile[securityId]);

    await this.notificationLogicController.createNotification({
      ...notification,
      eventCreatorId,
    });
    return {
      message: 'Notification successful',
    };
  }

  @get('/notifications/count', {
    responses: {
      '200': {
        description: 'Notification model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Notification) where?: Where<Notification>): Promise<Count> {
    return this.notificationRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/notifications/count_new', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Notification model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async countNew(@inject(SecurityBindings.USER) userProfile: UserProfile): Promise<Count> {
    const userId = parseInt(userProfile[securityId]);

    return this.notificationRepository.count({
      userId: userId,
      read: false,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/notifications', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Notification model instances',
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
                  items: notificationSchema(),
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
    @param.filter(Notification, {name: 'filterNotification'})
    filter?: Filter<Notification>,
  ): Promise<{
    count: number;
    data: Notification[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.notificationLogicController
      .find({
        userId,
        filter,
      })
      .catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/notifications/read/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Notification model instance',
        content: {
          'application/json': {
            schema: notificationSchema(),
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Notification, {exclude: 'where'})
    filter?: FilterExcludingWhere<Notification>,
  ): Promise<Notification> {
    const ctr = {
      ...notificationQuery(),
      filter,
    };
    const result = await this.notificationRepository.findById(id, ctr);
    await this.notificationRepository.updateById(id, {
      status: NOTIFICATION_STATUS_READ,
    });
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/notifications/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Notification DELETE success',
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
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    await this.usersRepository.notifications(userId).delete({
      id,
    });
    return {
      message: 'Delete messenger successful',
    };
  }
}

export function notificationSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Notification).definitions.Notification.properties,
      targetPost: getModelSchemaRef(Posts),
      eventCreator: userInfoSchema(),
      comment: getModelSchemaRef(Comments),
      childComment: getModelSchemaRef(ChildComment),
      ranking: getModelSchemaRef(Rankings),
      replyRanking: getModelSchemaRef(ReplyRanking),
      locationRequest: getModelSchemaRef(LocationRequests),
      metadata: getModelSchemaRef(NotificationMetadata),
      activity: getModelSchemaRef(Activity),
      booking: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Booking).definitions.Booking.properties,
          service: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Service).definitions.Service.properties,
            },
          },
        },
      },
      page: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Page).definitions.Page.properties,
          avatar: getModelSchemaRef(MediaContents),
        },
      },
    },
  };
}

export function notificationQuery() {
  return {
    include: [
      {
        relation: 'targetPost',
        scope: {
          include: [
            {
              relation: 'mediaContents',
            },
          ],
        },
      },
      {
        relation: 'comment',
      },
      {
        relation: 'page',
        scope: {
          include: [
            {
              relation: 'avatar',
            },
          ],
        },
      },
      {
        relation: 'childComment',
      },
      {
        relation: 'ranking',
      },
      {
        relation: 'replyRanking',
      },
      {
        relation: 'locationRequest',
      },
      {
        relation: 'booking',
        scope: {
          include: [
            {
              relation: 'service',
            },
          ],
        },
      },
      {
        relation: 'eventCreator',
        scope: userInfoQuery(true),
      },
    ],
  };
}
