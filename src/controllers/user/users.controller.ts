import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/context';
import {AnyObject} from '@loopback/repository';
import {get, getModelSchemaRef, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {UserLogicController} from '..';
import {Follow, Users} from '../../models';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {CredentialsRequestBody, userInfoSchema} from '../specs/user-controller.specs';

import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {
  CredentialsInterface,
  RegisterRequestInterface,
  RequestLoginAppleInterface,
  RequestLoginFacebokInterface,
  ResetPasswordInterface,
} from './user-interface';
import {handleError} from '../../utils/handleError';

export class UsersController {
  constructor(
    @inject('controllers.UserLogicController')
    public userLogicController: UserLogicController,
  ) {}

  //register
  @post('/register', {
    responses: {
      '200': {
        description: 'Register user',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': Users,
            },
          },
        },
      },
    },
  })
  async register(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              username: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              password: {
                type: 'string',
              },
              phone: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    newUserRequest: RegisterRequestInterface,
  ): Promise<Users> {
    // All new users have the "customer" role by default
    // ensure a valid email value and password value
    return this.userLogicController.handleRegisterAccount(newUserRequest);
  }

  @post('/send-verify-code', {
    responses: {
      '200': {
        description: 'Send verify code to email',
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
  async sendVerifyCode(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      email: string;
    },
  ): Promise<{message: string}> {
    return this.userLogicController.sendVerifyCode(request);
  }

  @post('/verify', {
    responses: {
      '200': {
        description: 'Verify email',
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
  async verify(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
              deviceToken: {
                type: 'string',
              },
              language: {
                type: 'string',
              },
              macAddress: {
                type: 'string',
              },
              ipAddress: {
                type: 'string',
              },
              brand: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              systemVersion: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      email: string;
      code: string;
      deviceToken?: string;
      language?: string;
    },
  ): Promise<{token: string; current_user: Users}> {
    return this.userLogicController.verify(request);
  }

  //login
  @post('/login', {
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
  async login(
    @requestBody(CredentialsRequestBody) credentials: CredentialsInterface,
  ): Promise<{token: string; current_user: Users}> {
    // ensure the user exists, and the password is correct
    return this.userLogicController.login(credentials);
  }

  //logout
  @post('/logout', {
    responses: {
      '200': {
        description: 'Logout & Delete Device Token',
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
  async logout(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              deviceToken: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      deviceToken: string;
    },
  ): Promise<{message: string}> {
    return this.userLogicController.logout({
      deviceToken: request.deviceToken,
    });
  }

  //login
  @post('/login/facebook', {
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
  async loginFacebook(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              id: {
                type: 'string',
              },
              picture: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      url: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
              deviceToken: {
                type: 'string',
              },
              language: {
                type: 'string',
              },
              macAddress: {
                type: 'string',
              },
              ipAddress: {
                type: 'string',
              },
              brand: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              systemVersion: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: RequestLoginFacebokInterface,
  ): Promise<{token: string; current_user: Users}> {
    return this.userLogicController.loginFacebook(request);
  }

  //login
  @post('/login/google', {
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
  async loginGoogle(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              id: {
                type: 'string',
              },
              picture: {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      url: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
              deviceToken: {
                type: 'string',
              },
              language: {
                type: 'string',
              },
              macAddress: {
                type: 'string',
              },
              ipAddress: {
                type: 'string',
              },
              brand: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              systemVersion: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: RequestLoginFacebokInterface,
  ): Promise<{token: string; current_user: Users}> {
    return this.userLogicController.loginGoogle(request);
  }

  //login
  @post('/login/apple', {
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
  async loginApple(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              authorizationCode: {
                type: 'string',
              },
              email: {
                type: 'string',
              },
              familyName: {
                type: 'string',
              },
              givenName: {
                type: 'string',
              },
              identityToken: {
                type: 'string',
              },
              deviceToken: {
                type: 'string',
              },
              language: {
                type: 'string',
              },
              macAddress: {
                type: 'string',
              },
              ipAddress: {
                type: 'string',
              },
              brand: {
                type: 'string',
              },
              model: {
                type: 'string',
              },
              systemVersion: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: RequestLoginAppleInterface,
  ): Promise<{token: string; current_user: Users}> {
    return this.userLogicController.loginApple(request);
  }

  //reset_password
  @post('/forgot-password', {
    responses: {
      '200': {
        description: 'Request to get code for update password',
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
  async forgotPassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      email: string;
    },
  ): Promise<{message: string}> {
    return this.userLogicController.forgotPassword(request);
  }

  @post('/reset-password', {
    responses: {
      '200': {
        description: 'Reset password by new password',
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
  async resetPassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
              password: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: ResetPasswordInterface,
  ): Promise<{message: string}> {
    return this.userLogicController.resetPassword(request);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/user/update-password', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Reset password by new password',
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
  async addPasswordWithFacebookAccount(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              password: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      password: string;
    },
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController
      .addPasswordWithFacebookAccount({
        userId,
        password: request.password,
      })
      .catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/check-had-password', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Check account had password',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                status: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async checkAccountHadPassword(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.checkAccountHadPassword(userId).catch((e) => handleError(e));
  }

  //get profile
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/me', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: userInfoSchema(),
          },
        },
      },
    },
  })
  async getCurrentUser(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<Users> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.getCurrentUser(userId);
  }

  //get user by user id
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...userInfoSchema().properties,
                followed: {
                  type: 'boolean',
                },
                followStatus: {
                  type: 'string',
                },
                totalPost: {
                  type: 'number',
                },
                totalFollowing: {
                  type: 'number',
                },
                totalFollower: {
                  type: 'number',
                },
                follower: getModelSchemaRef(Follow),
              },
            },
          },
        },
      },
    },
  })
  async getUserById(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id')
    id: number,
    @param({
      name: 'ignoreCheckIsBlocked',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'boolean',
          },
        },
      },
    })
    ignoreCheckIsBlocked?: boolean,
  ): Promise<AnyObject> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.getUserById(id, userId, ignoreCheckIsBlocked).catch((err) => handleError(err));
  }

  //change password
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/user/change-password', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'The current user profile',
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
  async changePassword(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              curPassword: {
                type: 'string',
              },
              newPassword: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      curPassword: string;
      newPassword: string;
    },
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.changePassword(request, userId);
  }

  //verify_token
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/verify_token', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'verify token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
    },
  })
  async verifyToken(@inject(SecurityBindings.USER) userProfile: UserProfile): Promise<AnyObject> {
    return userProfile;
  }

  //get_list_deviceToken
  @post('/user/get-list-device-token', {
    responses: {
      '200': {
        description: 'List device token',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  deviceToken: {
                    type: 'string',
                  },
                  language: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getListDeviceToken(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'listUserId',
            type: 'object',
            properties: {
              userIds: {
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
    request: {
      userIds: number[];
    },
  ): Promise<AnyObject[]> {
    return this.userLogicController.getListDeviceToken(request);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/update-language', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Update language was successfully',
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
  async updateLanguage(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdateLanguage',
            properties: {
              deviceToken: {
                type: 'string',
              },
              language: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      deviceToken: string;
      language: string;
    },
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.updateLanguage(userId, request.deviceToken, request.language);
  }

  @post('/user/check-exist-email', {
    responses: {
      '200': {
        description: 'Check exist email',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isExist: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async checkExistEmail(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'emailCheck',
            type: 'object',
            properties: {
              email: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      email: string;
    },
  ): Promise<{isExist: boolean}> {
    const result = await this.userLogicController.checkExistEmail(request.email);
    return {
      isExist: result,
    };
  }

  @post('/user/check-exist-username', {
    responses: {
      '200': {
        description: 'Check exist username',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isExist: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async checkExistUsername(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'username',
            type: 'object',
            properties: {
              username: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      username: string;
    },
  ): Promise<{isExist: boolean}> {
    const result = await this.userLogicController.checkExistUsername(request.username);
    return {
      isExist: result,
    };
  }

  //get list user
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/search', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'List user',
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
                    ...userInfoSchema(),
                    properties: {
                      ...userInfoSchema().properties,
                      totalPost: {
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
  async searchUser(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'userFilterSearch',
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
              where: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(Users).definitions.Users.properties,
                },
              },
            },
          },
        },
      },
    })
    userSearch: {
      q: string;
      offset: number;
      limit: number;
      skip: number;
      order: string[];
      where: object;
    },
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.searchUser(userSearch, userId);
  }

  // recommend user
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/recommend-friends', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Recommend user',
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
                    ...userInfoSchema(),
                    properties: {
                      ...userInfoSchema().properties,
                      followed: {
                        type: 'boolean',
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
  async recommendFriends(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'filterRecommendFriends',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
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
              where: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(Users).definitions.Users.properties,
                },
              },
            },
          },
        },
      },
    })
    recommendFriends: {
      offset: number;
      limit: number;
      skip: number;
      order: string[];
      where: object;
    },
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.userLogicController.recommendFriends(recommendFriends, userId);
  }
}
