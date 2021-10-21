import {inject} from '@loopback/core';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {AuthHandler} from './auth.handler';
import {post, param} from '@loopback/rest';
import {userInfoSchema} from '../specs/user-controller.specs';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Users} from '../../models';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_CUSTOMER} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';

export class AuthController {
  constructor(@inject(HandlerBindingKeys.AUTH_HANDLER) public authHandler: AuthHandler) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/auth/token/page/{pageId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Token & User info',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
                current_user: userInfoSchema(),
              },
            },
          },
        },
      },
    },
  })
  async pageGenerateToken(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('pageId') pageId: number,
  ): Promise<{token: string; current_user: Users}> {
    // ensure the user exists, and the password is correct
    return this.authHandler.pageGenerateToken(pageId, currentUser);
  }
}
