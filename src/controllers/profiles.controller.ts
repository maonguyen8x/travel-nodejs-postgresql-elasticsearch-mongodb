import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {getModelSchemaRef, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {
  Avatars,
  Backgrounds,
  UserAddress,
  UserBirthday,
  UserEmail,
  UserGender,
  UserIntroduce,
  UserPhone,
  Users,
  UserWebsite,
  UserWork,
} from '../models';
import {
  AvatarsRepository,
  BackgroundsRepository,
  ConversationRepository,
  ProfilesRepository,
  UsersRepository,
} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {userInfoQuery, userInfoSchema} from './specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import omit from 'lodash/omit';
import {MessagesHandlerController} from './messages/messages-handler.controller';

export class ProfilesController {
  constructor(
    @repository(ProfilesRepository)
    public profilesRepository: ProfilesRepository,
    @repository(AvatarsRepository)
    public avatarsRepository: AvatarsRepository,
    @repository(BackgroundsRepository)
    public backgroundRepository: BackgroundsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(ConversationRepository)
    public conversationRepository: ConversationRepository,
    @inject('controllers.MessagesHandlerController')
    public messagesHandlerController: MessagesHandlerController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/profiles', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Profiles PATCH success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                data: userInfoSchema(),
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdateProfile',
            properties: {
              name: {
                type: 'string',
              },
              username: {
                type: 'string',
              },
              birthday: getModelSchemaRef(UserBirthday, {
                exclude: ['id', 'profileId'],
              }),
              address: getModelSchemaRef(UserAddress, {
                exclude: ['id', 'profileId'],
              }),
              gender: getModelSchemaRef(UserGender, {
                exclude: ['id', 'profileId'],
              }),
              introduce: getModelSchemaRef(UserIntroduce, {
                exclude: ['id', 'profileId'],
              }),
              work: getModelSchemaRef(UserWork, {exclude: ['id', 'profileId']}),
              education: {
                type: 'string',
              },
              bio: {
                type: 'string',
              },
              avatars: getModelSchemaRef(Avatars, {
                exclude: ['id', 'profileId'],
              }),
              backgrounds: getModelSchemaRef(Backgrounds, {
                exclude: ['id', 'profileId'],
              }),
              email: getModelSchemaRef(UserEmail, {exclude: ['id', 'userId']}),
              website: getModelSchemaRef(UserWebsite, {
                exclude: ['id', 'profileId'],
              }),
              phone: getModelSchemaRef(UserPhone, {
                exclude: ['id', 'profileId'],
              }),
            },
          },
        },
      },
    })
    profiles: {
      name: string;
      username: string;
      birthday: UserBirthday;
      address: UserAddress;
      gender: UserGender;
      introduce: UserIntroduce;
      work: UserWork;
      education: string;
      bio: string;
      avatars: Avatars;
      backgrounds: Backgrounds;
      email: UserEmail;
      website: UserWebsite;
      phone: UserPhone;
    },
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<{message: string; data: Users}> {
    const userId = parseInt(currentUserProfile[securityId]);
    let curentUser = await this.usersRepository.findById(parseInt(currentUserProfile[securityId]), {
      ...userInfoQuery(false),
    });
    if (profiles.email) {
      await this.usersRepository.email(parseInt(currentUserProfile[securityId])).patch(profiles.email);
    }
    if (profiles.name) {
      await this.usersRepository.updateById(parseInt(currentUserProfile[securityId]), {name: profiles.name});
    }
    if (profiles.username) {
      await this.usersRepository.updateById(parseInt(currentUserProfile[securityId]), {username: profiles.username});
    }
    const currentProfile = curentUser.profiles;
    await this.profilesRepository.updateById(currentProfile.id, omit(profiles, ['email', 'name']));
    curentUser = await this.usersRepository.findById(parseInt(currentUserProfile[securityId]), {
      ...userInfoQuery(false),
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.usersRepository.updateElastic(userId);
    // handle change all conversation in database to elasticsearch
    const conversationIds = (
      await this.conversationRepository.find({
        where: {
          participants: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            elemMatch: {
              userId,
            },
          },
        },
      })
    ).map((item: any) => item.id);
    conversationIds.forEach(async (item: any) => {
      const result = await this.conversationRepository.findById(item);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.messagesHandlerController.handleUpdateDataConverationToElasticSearch(result);
    });
    return {
      message: 'Update profile success',
      data: curentUser,
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/avatar', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Avatar PATCH success',
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
  async updateAvatar(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'Avatar',
            properties: {
              mediaContentId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    media: Avatars,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<{message: string}> {
    const currentUser = await this.usersRepository.findById(parseInt(currentUserProfile[securityId]), {
      include: [{relation: 'profiles'}],
    });
    await this.profilesRepository.avatars(currentUser.profiles.id).patch({mediaContentId: media.mediaContentId});
    return {
      message: 'Update avatar success',
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/background', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Background PATCH success',
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
  async updateBackground(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'Background',
            properties: {
              mediaContentId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    media: Backgrounds,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<{message: string}> {
    const currentUser = await this.usersRepository.findById(parseInt(currentUserProfile[securityId]), {
      include: [{relation: 'profiles'}],
    });
    await this.profilesRepository.backgrounds(currentUser.profiles.id).patch({mediaContentId: media.mediaContentId});
    return {
      message: 'Update background success',
    };
  }
}
