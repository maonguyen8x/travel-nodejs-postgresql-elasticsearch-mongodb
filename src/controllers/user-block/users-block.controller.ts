import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/context';
import {Filter} from '@loopback/repository';
import {get, param, post, del} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';

import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {UsersBlockHandler} from './users-block.handler';
import {UsersBlock, Users} from '../../models';
import {handleError} from '../../utils/handleError';
import {userSchema, profileSchema, avatarsSchema, mediaContentSchema} from '../user/user.constant';

export class UsersBlockController {
  constructor(
    @inject(HandlerBindingKeys.USERS_BLOCK_HANDLER)
    public usersBlockHandler: UsersBlockHandler,
  ) {}

  // Map to `GET /users/block`
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/users/block', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Users block ',
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
                  items: userSchema({
                    profiles: profileSchema({
                      avatars: avatarsSchema({
                        mediaContent: mediaContentSchema(),
                      }),
                    }),
                  }),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(UsersBlock, {name: 'filterUsersBlock'})
    filter?: Filter<UsersBlock>,
    @param({
      name: 'keyword',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'string',
          },
        },
      },
    })
    keyword?: string,
  ): Promise<{count: number; data: Users[]}> {
    const where = {...(keyword ? {name: {like: `%${keyword}%`}} : {})};
    const include = [
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
    ];
    return this.usersBlockHandler.find(currentUser, {...filter, include, where}).catch((error) => handleError(error));
  }

  // Map to `POST /users/block`
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/users/block/{userId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Users block ',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('userId') userId: number,
  ): Promise<{success: boolean}> {
    const creatorId = parseInt(currentUser[securityId]);

    return this.usersBlockHandler
      .create({userId, creatorId})
      .then((result) => result)
      .catch((error) => handleError(error));
  }

  // Map to `DELETE /users/block`
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/users/block/{userId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Users block ',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async deleteByUserId(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('userId') userId: number,
  ): Promise<{success: boolean}> {
    const creatorId = parseInt(currentUser[securityId]);

    return this.usersBlockHandler
      .deleteByUserId({userId, creatorId})
      .then((result) => result)
      .catch((error) => handleError(error));
  }
}
