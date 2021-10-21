import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {Feedback} from '../../models';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {FeedbackHandler} from './feedback.handler';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_CUSTOMER} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';

export class FeedbackController {
  constructor(
    @inject(HandlerBindingKeys.FEEDBACK_HANDLER)
    public feedbackHandler: FeedbackHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/feedbacks', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Feedback model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Feedback, {
              exclude: ['createdAt', 'updatedAt', 'deletedAt'],
            }),
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
            ...getModelSchemaRef(Feedback, {
              title: 'NewFeedback',
              exclude: ['id', 'userId', 'createdAt', 'updatedAt', 'deletedAt', 'status'],
            }),
            required: ['attachments'],
          },
        },
      },
    })
    feedback: Omit<Feedback, 'id'>,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Feedback> {
    const userId = parseInt(userProfile[securityId]);
    return this.feedbackHandler.create(feedback, userId);
  }

  @post('/feedbacks/unblock-account', {
    responses: {
      '200': {
        description: 'Feedback model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Feedback, {
              exclude: ['createdAt', 'updatedAt', 'deletedAt'],
            }),
          },
        },
      },
    },
  })
  async feedbackUnblockAccount(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'feedbackUnblockAccount',
            properties: {
              content: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
            },
            required: ['email'],
          },
        },
      },
    })
    newFeedbackUnblockAccountRequest: {
      content: string;
      email: string;
    },
  ): Promise<Feedback> {
    return this.feedbackHandler.feedbackUnblockAccount(newFeedbackUnblockAccountRequest);
  }
}
