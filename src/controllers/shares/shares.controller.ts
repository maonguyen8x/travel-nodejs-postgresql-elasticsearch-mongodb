import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, Where} from '@loopback/repository';
import {get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Shares} from '../../models';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {userInfoQuery, userInfoSchema} from '../specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {SharesHandler} from './shares.handler';
import {POST_ACCESS_TYPES} from '../../configs/post-constants';

export class SharesController {
  constructor(
    @inject(HandlerBindingKeys.SHARES_HANDLER)
    public sharesHandler: SharesHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/shares', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Shares model instance',
        content: {'application/json': {schema: getModelSchemaRef(Shares)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'NewShares',
            properties: {
              ...getModelSchemaRef(Shares, {
                title: 'CustormShare',
                exclude: ['id', 'createdAt', 'userId', 'updatedAt', 'deletedAt', 'postShareId'],
              }).definitions.CustormShare.properties,
              accessType: {
                type: 'string',
                enum: POST_ACCESS_TYPES,
              },
            },
          },
        },
      },
    })
    shares: {postId: number; content: string; accessType?: string},
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Shares> {
    const userId = parseInt(currentUserProfile[securityId]);
    return this.sharesHandler.create(shares, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/shares/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Shares model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Shares) where?: Where<Shares>): Promise<Count> {
    return this.sharesHandler.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/post/{id}/shares', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Shares model instances',
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
                  items: sharesInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER)
    currentUser: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Shares, {name: 'filterShares'}) filter?: Filter<Shares>,
  ): Promise<{count: number; data: AnyObject[]}> {
    const userId = parseInt(currentUser[securityId]);
    return this.sharesHandler.find(userId, id, filter);
  }
}

export function sharesInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Shares).definitions.Shares.properties,
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
  };
}

export function sharesInfoQuery(userId: number) {
  return {
    include: [
      {
        relation: 'user',
        scope: {
          include: [
            ...userInfoQuery(true, userId).include,
            {
              relation: 'following',
              scope: {
                where: {
                  userId,
                },
              },
            },
          ],
        },
      },
    ],
  };
}
