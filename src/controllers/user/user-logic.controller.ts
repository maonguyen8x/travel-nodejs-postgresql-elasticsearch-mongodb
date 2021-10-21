// Uncomment these imports to begin using these cool features!
import {AnyObject, repository} from '@loopback/repository';
import {FOLLOW_STATUS_ACCEPTED, FOLLOW_STATUS_REQUESTED} from '../../configs/follow-constants';
import {Conversation, Follow, Message, Users, UsersWithRelations} from '../../models';
import {
  ConversationRepository,
  Credentials,
  DeviceTokenRepository,
  FollowRepository,
  MediaContentsRepository,
  MessageRepository,
  PostsRepository,
  ProfilesRepository,
  UsercredentialsRepository,
  UserEmailRepository,
  UsersRepository,
} from '../../repositories';
import {changeAlias, convertNameToUserNameUnique, parseOrderToElasticSort} from '../../utils/handleString';
import {userInfoQuery} from '../specs/user-controller.specs';
import {compare} from '../../utils/Array';
import {handleError} from '../../utils/handleError';
import {validateCredentials} from '../../services/validator';
import _, {get, isEmpty, omit, pick} from 'lodash';
import {
  ACCOUNT_HAD_NOT_PASSWORD_YET,
  ACCOUNT_HAD_PASSWORD,
  FB_API_URL,
  FB_DEFAULT_PROPERTIES,
  USER_EMAIL_FACEBOOK_SUFFIX,
  USER_MESSAGE_SENT_VERIFY_CODE_SUCCESS,
  USER_MESSAGE_SENT_VERIFY_CODE_UPDATE_PASSWORD_SUCCESS,
  USER_MESSAGE_UPDATE_PASSWORD_SUCCESS,
  USER_ROLE_NORMAL_USER,
  USER_TYPE_ACCESS_FACEBOOK,
  USER_TYPE_ACCESS_NORMAL,
  USER_TYPE_ACCESS_PAGE,
  APPLE_AUTHEN_API_URL,
  USER_TYPE_ACCESS_APPLE,
  LOG_OUT_SUCCESS,
  LOG_OUT_FAIL,
  USER_MESSAGE_UPDATE_LANGUAGE_SUCCESS,
  USER_MESSAGE_UPDATE_PASSWORD_FAIL,
  CURRENT_PASSWORD_INCORRECT,
  USER_TYPE_ACCESS_GOOGLE,
  USER_EMAIL_GOOGLE_SUFFIX,
} from '../../configs/user-constants';
import {
  ElasticSearchResultHitInterface,
  ELASTICwhereToMatchs,
  getHit,
  POSTGRE_DUPLICATE_ERROR_CODE,
  LANGUAGES,
  IMAGE_FOLDER_PATH,
} from '../../configs/utils-constant';
import {HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/context';
import {MediaContentsHandlerController} from '../media-contents/media-contents-handler.controller';
import {PasswordHasher} from '../../services/hash.password.bcryptjs';
import {PasswordHasherBindings, RedisServiceBindings, TokenServiceBindings, UserServiceBindings} from '../../keys';
import {RedisService} from '../../services/redis-service';
import {registerSuccessMail, verifyCodeEmail} from '../specs/account_template';
import {securityId} from '@loopback/security';
import {TokenService, UserService} from '@loopback/authentication';
import {
  AddPasswordRequestInterface,
  CredentialsInterface,
  RegisterRequestFacebookInterface,
  RegisterRequestInterface,
  RequestLoginAppleInterface,
  RequestLoginFacebokInterface,
  RequestLogoutInterface,
  ResetPasswordInterface,
  UserWithRecommend,
  UserWithTotalPost,
} from './user-interface';
import {userInfoQueryWithFlagFollow} from '..';
import {
  POST_ACCESS_TYPE_FOLLOW,
  POST_ACCESS_TYPE_PUBLIC,
  POST_ACCESS_TYPES,
  PostStatusEnum,
} from '../../configs/post-constants';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {UsersBlockHandler} from '../user-block/users-block.handler';
import {ErrorCode} from '../../constants/error.constant';
import axios from 'axios';
import jose from 'jose';
import {EmailService} from '../../services';
import {ConversationTypesConstant, MessageConstants, MESSAGE_DEFAULT_JGOOOOO} from '../../configs/message-constant';
import moment from 'moment';
import {MessagesHandlerController} from '../messages/messages-handler.controller';
import * as root from 'app-root-path';
import request from 'request';
import {ACCOUNT_HAS_BEEN_BLOCKED} from './user.constant';
const fs = require('fs');

// import {inject} from '@loopback/context';

export class UserLogicController {
  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(UsercredentialsRepository)
    public usercredentialsRepository: UsercredentialsRepository,
    @repository(UserEmailRepository)
    public userEmailRepository: UserEmailRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(FollowRepository)
    public followRepository: FollowRepository,
    @repository(ProfilesRepository)
    public profilesRepository: ProfilesRepository,
    @repository(DeviceTokenRepository)
    public deviceInfoRepository: DeviceTokenRepository,
    @repository(ConversationRepository)
    public conversationRepository: ConversationRepository,
    @repository(MessageRepository)
    public messageRepository: MessageRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<Users, Credentials>,
    @inject(RedisServiceBindings.REDIS_SERVICE)
    public redisService: RedisService,
    @inject('controllers.MediaContentsHandlerController')
    public mediaContentsHandler: MediaContentsHandlerController,
    @inject('controllers.MessagesHandlerController')
    public messagesHandlerController: MessagesHandlerController,
    @inject(HandlerBindingKeys.USERS_BLOCK_HANDLER)
    public usersBlockHandler: UsersBlockHandler,
    // @inject('controllers.PlanLogicController')
    // public planLogicController: PlanLogicController,
    @inject('emailService')
    public emailSv: EmailService,
  ) {}

  async listUserFollowing(userId: number): Promise<Follow[]> {
    return this.followRepository.find({
      where: {
        userId,
        followStatus: FOLLOW_STATUS_ACCEPTED,
      },
    });
  }

  async listUserFollowingRequest(userId: number): Promise<Follow[]> {
    return this.followRepository.find({
      where: {
        userId,
        followStatus: FOLLOW_STATUS_REQUESTED,
      },
    });
  }

  async searchUser(
    filter: AnyObject,
    userId: number,
  ): Promise<{
    count: number;
    data: UserWithTotalPost[];
  }> {
    const mustNot: AnyObject[] = [
      {
        match: {
          userTypeAccess: USER_TYPE_ACCESS_PAGE,
        },
      },
      {
        match: {
          isActive: false,
        },
      },
    ];
    const listBlocker = await this.usersBlockHandler.getListUserBlockIds(userId);
    if (listBlocker.length) {
      mustNot.push({
        terms: {
          id: listBlocker,
        },
      });
    }
    const where = filter?.where || {};
    const matchs = ELASTICwhereToMatchs(where);
    const must: AnyObject[] = [...matchs];
    const q = filter?.q;
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['name', 'username', 'email.email'],
        },
      });
    }
    const body: AnyObject = {
      sort: [
        ...(q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
        ...parseOrderToElasticSort(filter?.order || ['']),
      ],
      _source: ['id'],
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: must,
          must_not: mustNot,
        },
      },
    };
    const searchResult = await this.usersRepository.elasticService.get(body);
    if (!isEmpty(searchResult)) {
      // TODO: confirm count with data from es vs count data
      // const count = _.get(searchResult, 'body.hits.total.value', 0);
      const hit = getHit(searchResult);
      const userIds = Array.from(hit, (item: ElasticSearchResultHitInterface) => _.get(item, '_source.id')).filter(
        (item) => item,
      );
      const countData = await this.usersRepository.count({
        id: {
          inq: userIds,
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        blockedAt: null,
      });
      const data = await this.usersRepository.find({
        ...userInfoQuery(true, userId),
        where: {
          id: {
            inq: userIds,
          },
        },
      });
      const dataWithTotalPost = await Promise.all(data.map((userItem) => this.handleReturnUserWithTotalPost(userItem)));
      const dataOrdering = dataWithTotalPost
        .map((item) => {
          return {
            ...item,
            key: userIds.findIndex((key) => key === item.id),
          };
        })
        .sort((a, b) => {
          return compare(a, b, 'key');
        });
      return {
        count: countData.count,
        data: dataOrdering,
      };
    }
    return {
      count: 0,
      data: [],
    };
  }

  async handleReturnUserWithTotalPost(user: UsersWithRelations): Promise<UserWithTotalPost> {
    const countPost = await this.postsRepository.count({
      creatorId: user.id,
      accessType: {
        inq: [POST_ACCESS_TYPE_PUBLIC, POST_ACCESS_TYPE_FOLLOW],
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      deletedAt: null,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      blockedAt: null,
      status: PostStatusEnum.public,
      showOnProfile: true,
    });

    return {
      ...user,
      totalPost: countPost.count,
    };
  }

  async getFacebookUserData(
    accessToken: string,
  ): Promise<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }> {
    const options = {
      uri: FB_API_URL,
      params: {
        fields: FB_DEFAULT_PROPERTIES.join(','),
        access_token: accessToken,
      },
    };

    return (await axios.get(FB_API_URL, options)).data as {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
  }

  async verifyAppleToken(identityToken: string): Promise<{email: string; sub: string}> {
    try {
      const result = (await axios.get(APPLE_AUTHEN_API_URL)).data;
      const key = jose.JWKS.asKeyStore(result);
      const verified = jose.JWT.verify(identityToken, key) as {email: string; sub: string};
      return {
        email: verified.email,
        sub: verified.sub,
      };
    } catch (e) {
      return handleError(new HttpErrors.Unauthorized(ErrorCode.INVALID_TOKEN));
    }
  }

  async handleRegisterAccount(newUserRequest: RegisterRequestInterface): Promise<Users> {
    try {
      const [email, username] = await Promise.all([
        this.userEmailRepository.findOne({
          where: {
            email: newUserRequest.email,
          },
        }),
        this.usersRepository.findOne({
          where: {
            username: newUserRequest.username,
          },
        }),
      ]);
      if (email) {
        throw new HttpErrors.NotAcceptable(ErrorCode.DUPLICATE_EMAIL);
      } else if (username) {
        throw new HttpErrors.NotAcceptable(ErrorCode.DUPLICATE_USERNAME);
      } else {
        // All new users have the "customer" role by default
        // ensure a valid email value and password value
        validateCredentials(pick(newUserRequest, ['email', 'password']));
        // encrypt the password
        const password = await this.passwordHasher.hashPassword(newUserRequest.password);
        // create the new user
        const newUser = {
          name: newUserRequest.name,
          username: newUserRequest.username,
          password: password,
          profiles: {
            phone: {},
          },
          email: {
            email: newUserRequest.email,
          },
          userTypeAccess: USER_TYPE_ACCESS_NORMAL,
          roles: USER_ROLE_NORMAL_USER,
        };
        if (newUserRequest.phone) {
          newUser.profiles.phone = {
            phone: newUserRequest.phone,
          };
        }
       
        const savedUser = await this.usersRepository.create(omit(newUser, 'password'));
        const [email] = await Promise.all([
          this.usersRepository.email(savedUser.id).get(),
          this.usersRepository.usercredentials(savedUser.id).create({password}), // set the password
        ]);
        if (email) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.sendVerifyCode({email: email?.email || ''});
        }
        return savedUser;
      }
    } catch (error) {
      if (error.code === POSTGRE_DUPLICATE_ERROR_CODE) {
        throw new HttpErrors.Conflict(ErrorCode.DUPLICATE_EMAIL);
      }
      throw error;
    }
  }

  downloadImageFromURL = async (url: string, path: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(path);
      request.head(url, (err, res, body) => {
        request(url).pipe(writeStream);
      });
      writeStream.on('error', (err: any) => reject(err)).on('finish', () => resolve());
    });
  };

  async handleRegisterAccountFacebook(newUserRequest: RegisterRequestFacebookInterface): Promise<Users> {
    try {
      const email = await this.userEmailRepository.findOne({
        where: {
          email: newUserRequest.email,
        },
      });
      if (email) {
        throw new HttpErrors.NotAcceptable(ErrorCode.DUPLICATE_EMAIL);
      } else {
        // create the new user
        const newUser = {
          name: newUserRequest.name,
          username: convertNameToUserNameUnique(newUserRequest.name),
          profiles: {
            birthday: {},
            gender: {},
            avatars: {},
          },
          email: {
            email: newUserRequest.email,
            identityApple: newUserRequest.identityApple,
          },
          userTypeAccess: newUserRequest.userTypeAccess,
          roles: USER_ROLE_NORMAL_USER,
        };
        if (newUserRequest.birthday) {
          newUser.profiles.birthday = {
            birthday: newUserRequest.birthday,
          };
        }
        if (newUserRequest.gender) {
          newUser.profiles.gender = {
            gender: newUserRequest.gender,
          };
        }
        if (newUserRequest.avatar) {
          const newPathAvatar =
            newUserRequest.userTypeAccess === USER_TYPE_ACCESS_FACEBOOK
              ? `${root}${IMAGE_FOLDER_PATH}/avatar_fb_${new Date().getTime()}.jpeg`
              : `${root}${IMAGE_FOLDER_PATH}/avatar_google_${new Date().getTime()}.jpeg`;
          await this.downloadImageFromURL(newUserRequest.avatar, newPathAvatar);
          const media = await this.mediaContentsHandler.uploadMedia({
            file: newPathAvatar,
          });
          newUser.profiles.avatars = {
            mediaContentId: media.id,
          };
        }
        const savedUser = await this.usersRepository.create(newUser);
        // eslint-disable-next-line no-shadow
        const email = await this.usersRepository.email(savedUser.id).get();
        await this.usersRepository.activeUser(email.userId, {isActive: true});
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.usersRepository.updateElastic(email.userId);
        const conversationWithAdmin = await this.createConversationWithAdmin(email.userId);
        const messageDataDefault: any = {
          message: MESSAGE_DEFAULT_JGOOOOO,
          messageType: MessageConstants.systemMessage,
        };
        if (conversationWithAdmin?.conversationKey) {
          await this.createMessageWithAdmin(email.userId, conversationWithAdmin.conversationKey, messageDataDefault);
        } else {
          throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        return savedUser;
      }
    } catch (error) {
      if (error.code === POSTGRE_DUPLICATE_ERROR_CODE) {
        return handleError(new HttpErrors.Conflict(ErrorCode.DUPLICATE_EMAIL));
      }
      return handleError(error);
    }
  }

  async sendVerifyCode(data: {email: string}): Promise<{message: string}> {
    if (!data?.email) {
      throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_EMAIL);
    }
    const email = await this.userEmailRepository.findOne({
      where: {
        email: data.email,
      },
      include: [
        {
          relation: 'user',
        },
      ],
    });
    if (!email) {
      throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_EMAIL);
    } else {
      const code = this.generateVerifyCode();
      this.redisService.set(data.email, code);
      await this.sendEmailVerify(email?.email, email?.user?.name, code);
      return {
        message: USER_MESSAGE_SENT_VERIFY_CODE_SUCCESS,
      };
    }
  }

  async verify(data: {
    email: string;
    code: string;
    deviceToken?: string;
    language?: string;
    macAddress?: string;
    ipAddress?: string;
    brand?: string;
    model?: string;
    systemVersion?: string;
  }): Promise<{token: string; current_user: Users}> {
    const email = await this.userEmailRepository.findOne({
      where: {
        email: data.email,
      },
      include: [
        {
          relation: 'user',
        },
      ],
    });
    if (!data.email || !email || !email?.user) {
      throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_EMAIL);
    }
    if (get(email, 'user.isActive') === true) {
      throw new HttpErrors.NotAcceptable(ErrorCode.USER_HAD_ACTIVE);
    }
    const verifyCode = await this.redisService.get(email.email || '');
    if (String(data.code) !== String(verifyCode)) {
      throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_CODE);
    }
    await this.usersRepository.activeUser(email.userId, {isActive: true});
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.usersRepository.updateElastic(email.userId);
    const conversationWithAdmin = await this.createConversationWithAdmin(email.userId);
    const messageDataDefault: any = {
      message: MESSAGE_DEFAULT_JGOOOOO,
      messageType: MessageConstants.systemMessage,
    };
    if (conversationWithAdmin?.conversationKey) {
      await this.createMessageWithAdmin(email.userId, conversationWithAdmin.conversationKey, messageDataDefault);
    } else {
      throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
    }
    const user = await this.usersRepository.findById(email.userId, {
      include: [
        {
          relation: 'email',
        },
      ],
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.emailSv.sendMail({
      to: user.email.email,
      subject: 'Welcome to jGooooo!',
      html: registerSuccessMail({
        name: user.name,
      }),
    });
    return this.generateDataLogin(
      user,
      data?.deviceToken,
      data?.language,
      data?.macAddress,
      data?.ipAddress,
      data?.brand,
      data?.model,
      data?.systemVersion,
    );
  }

  async createConversationWithAdmin(userId: number): Promise<Conversation> {
    const key = `${userId}-jGooooo`;
    const conversationExist = await this.conversationRepository.findOne({
      where: {
        conversationKey: key,
      },
    });
    if (conversationExist) {
      return conversationExist;
    }
    const readAt: AnyObject = {};
    const participants: AnyObject = {userId: userId};
    const accessRead: AnyObject = {userId: userId};
    const notify: AnyObject = {};
    const conversationType = ConversationTypesConstant.SYSTEM;
    const contributors: AnyObject = {userId: userId};
    const result = await this.conversationRepository.create({
      conversationName: 'jGooooo',
      conversationKey: key,
      readAt: readAt,
      participants: [participants],
      accessRead: [accessRead],
      accessWrite: [],
      notify: notify,
      conversationType: conversationType,
      contributors: [contributors],
    });
    await this.messagesHandlerController.handleUpdateDataConverationToElasticSearch(result);
    return result;
  }

  async createMessageWithAdmin(userId: number, conversationKey: string, message: Message) {
    let conversation: Conversation | null;
    if (conversationKey) {
      conversation = await this.conversationRepository.findOne({
        where: {
          conversationKey: conversationKey,
        },
      });
      if (!conversation) {
        throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
      }
      const result = await this.messageRepository.create({
        ...message,
        conversationId: String(conversation?.id),
        message: message?.message || MESSAGE_DEFAULT_JGOOOOO,
        messageType: message?.messageType || MessageConstants.systemMessage,
        accessRead: [
          {
            userId: userId,
          },
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.messagesHandlerController.handleNotificationMessage(result);
      // update time conversation
      await this.conversationRepository.updateById(conversation.id, {
        updatedAt: moment().utc().toISOString(),
      });
      return result;
    }
  }

  async login(credentials: CredentialsInterface): Promise<{token: string; current_user: Users}> {
    // ensure the user exists, and the password is correct
    const cre = {
      email: credentials.email,
      password: credentials.password,
    };
    const user = await this.userService.verifyCredentials(cre);
    return this.generateDataLogin(
      user,
      credentials?.deviceToken,
      credentials?.language,
      credentials?.macAddress,
      credentials?.ipAddress,
      credentials?.brand,
      credentials?.model,
      credentials?.systemVersion,
    );
  }

  async logout(data: RequestLogoutInterface): Promise<{message: string}> {
    let message = LOG_OUT_SUCCESS;
    const deviceToken = await this.deviceInfoRepository.findOne({
      where: {
        deviceToken: data.deviceToken,
      },
    });
    await this.deviceInfoRepository
      .deleteById(deviceToken?.id)
      .then(() => {
        message = LOG_OUT_SUCCESS;
      })
      .catch(() => {
        message = LOG_OUT_FAIL;
      });
    return {
      message: message,
    };
  }

  async loginFacebook(data: RequestLoginFacebokInterface): Promise<{token: string; current_user: Users}> {
    let user: Users;
    const usersResult = await this.getFacebookUserData(data.token);
    if (usersResult.email) {
      const userEmail = await this.userEmailRepository.findOne({
        where: {
          email: data.email,
        },
      });
      if (userEmail?.userId) {
        user = await this.usersRepository.findById(userEmail.userId);
      } else {
        user = await this.handleRegisterAccountFacebook({
          name: `${usersResult.first_name} ${usersResult.last_name}`,
          username: convertNameToUserNameUnique(`${usersResult.first_name} ${usersResult.last_name}`),
          email: usersResult.email,
          avatar: data.picture.data.url,
          userTypeAccess: USER_TYPE_ACCESS_FACEBOOK,
        });
      }
    } else {
      const userEmail = await this.userEmailRepository.findOne({
        where: {
          email: data.id + USER_EMAIL_FACEBOOK_SUFFIX,
        },
        include: [
          {
            relation: 'user',
          },
        ],
      });
      if (userEmail) {
        user = userEmail?.user;
      } else {
        user = await this.handleRegisterAccountFacebook({
          name: data.name,
          username: convertNameToUserNameUnique(data.name),
          email: data.id + USER_EMAIL_FACEBOOK_SUFFIX,
          avatar: data.picture.data.url,
          userTypeAccess: USER_TYPE_ACCESS_FACEBOOK,
        });
      }
    }
    return this.generateDataLogin(
      user,
      data?.deviceToken,
      data?.language,
      data?.macAddress,
      data?.ipAddress,
      data?.brand,
      data?.model,
      data?.systemVersion,
    );
  }

  async loginGoogle(data: RequestLoginFacebokInterface): Promise<{token: string; current_user: Users}> {
    let user: Users;
    if (data.email) {
      const userEmail = await this.userEmailRepository.findOne({
        where: {
          email: data.email,
        },
      });
      if (userEmail?.userId) {
        user = await this.usersRepository.findById(userEmail.userId);
      } else {
        user = await this.handleRegisterAccountFacebook({
          name: data.name,
          username: convertNameToUserNameUnique(data.name),
          email: data.email,
          avatar: data.picture.data.url,
          userTypeAccess: USER_TYPE_ACCESS_GOOGLE,
        });
      }
    } else {
      const userEmail = await this.userEmailRepository.findOne({
        where: {
          email: data.id + USER_EMAIL_GOOGLE_SUFFIX,
        },
        include: [
          {
            relation: 'user',
          },
        ],
      });
      if (userEmail) {
        user = userEmail?.user;
      } else {
        user = await this.handleRegisterAccountFacebook({
          name: data.name,
          username: convertNameToUserNameUnique(data.name),
          email: data.id + USER_EMAIL_GOOGLE_SUFFIX,
          avatar: data.picture.data.url,
          userTypeAccess: USER_TYPE_ACCESS_GOOGLE,
        });
      }
    }
    return this.generateDataLogin(
      user,
      data?.deviceToken,
      data?.language,
      data?.macAddress,
      data?.ipAddress,
      data?.brand,
      data?.model,
      data?.systemVersion,
    );
  }

  async loginApple(data: RequestLoginAppleInterface): Promise<{token: string; current_user: Users}> {
    try {
      let user: Users;
      const {email, sub} = await this.verifyAppleToken(data.identityToken);
      if (!email) {
        throw new HttpErrors.BadRequest(ErrorCode.INVALID_EMAIL);
      }
      if (data.email || email || sub) {
        const userEmail = await this.userEmailRepository.findOne({
          order: ['identityApple ASC'],
          where: {
            or: [
              {
                identityApple: sub,
              },
              {
                email: data.email || email,
              },
            ],
          },
        });
        if (userEmail?.userId) {
          user = await this.usersRepository.findById(userEmail.userId);
        } else {
          user = await this.handleRegisterAccountFacebook({
            name: `${data.familyName} ${data.givenName}`,
            username: convertNameToUserNameUnique(`${data.familyName} ${data.givenName}`),
            email: data.email || email,
            userTypeAccess: USER_TYPE_ACCESS_APPLE,
            identityApple: sub,
          });
        }
      } else {
        throw new HttpErrors.Unauthorized(ErrorCode.INVALID_TOKEN);
      }
      return await this.generateDataLogin(
        user,
        data?.deviceToken,
        data?.language,
        data?.macAddress,
        data?.ipAddress,
        data?.brand,
        data?.model,
        data?.systemVersion,
      );
    } catch (e) {
      return handleError(e);
    }
  }

  async forgotPassword(data: {email: string}): Promise<{message: string}> {
    try {
      const email = await this.userEmailRepository.findOne({
        where: {
          email: data.email,
        },
        include: [
          {
            relation: 'user',
          },
        ],
      });
      if (!email) {
        throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_EMAIL);
      }
      const code = this.generateVerifyCode();
      this.redisService.setx(data.email, code, 30 * 60);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.sendEmailVerify(email.email, email?.user?.name, code);
      return {
        message: USER_MESSAGE_SENT_VERIFY_CODE_UPDATE_PASSWORD_SUCCESS,
      };
    } catch (error) {
      return handleError(new HttpErrors.NotFound(ErrorCode.INVALID_EMAIL));
    }
  }

  async resetPassword(data: ResetPasswordInterface): Promise<{message: string}> {
    try {
      const email = await this.userEmailRepository.findOne({
        where: {
          email: data.email,
        },
      });
      if (!email || !data.email) {
        throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_EMAIL);
      }
      // get verifyCode from redis
      const verifyCode = await this.redisService.get(email.email || '');

      if (String(data.code) !== String(verifyCode)) {
        throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_CODE);
      }
      validateCredentials(pick(data, ['email', 'password']));
      const newPassword = await this.passwordHasher.hashPassword(data.password);
      const currentPass = await this.usercredentialsRepository.findOne({
        where: {
          usersId: email.userId,
        },
      });
      if (currentPass) {
        await this.usersRepository.usercredentials(email.userId).patch({password: newPassword});
      } else {
        await this.usercredentialsRepository.create({
          usersId: email.userId,
          password: newPassword,
        });
      }

      return {
        message: USER_MESSAGE_UPDATE_PASSWORD_SUCCESS,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async addPasswordWithFacebookAccount(data: AddPasswordRequestInterface): Promise<{message: string}> {
    const user = await this.usersRepository.findOne({
      where: {
        id: data.userId,
        userTypeAccess: USER_TYPE_ACCESS_FACEBOOK,
      },
    });
    if (!user) {
      throw new HttpErrors.NotAcceptable(ErrorCode.INVALID_TYPE_FACEBOOK);
    }

    const newPassword = await this.passwordHasher.hashPassword(data.password);
    try {
      const password = await this.usersRepository.usercredentials(data.userId).get();
      if (password) {
        throw new HttpErrors.NotAcceptable(ErrorCode.USER_ERROR_FACEBOOK_ACCOUNT_HAS_CREATED_PASSWORD);
      }
    } catch (e) {
      if (e.code !== 'ENTITY_NOT_FOUND') {
        return handleError(e);
      }
    }
    await this.usersRepository.usercredentials(data.userId).create({password: newPassword});
    return {
      message: USER_MESSAGE_UPDATE_PASSWORD_SUCCESS,
    };
  }

  async checkAccountHadPassword(
    userId: number,
  ): Promise<{
    status: boolean;
    message: string;
  }> {
    try {
      const user = await this.usersRepository.exists(userId);
      if (!user) {
        throw new HttpErrors.NotFound(ErrorCode.USER_NOT_FOUND);
      }
      const password = await this.usercredentialsRepository.findOne({
        where: {
          usersId: userId,
        },
      });
      if (password) {
        return {
          status: true,
          message: ACCOUNT_HAD_PASSWORD,
        };
      }
      return {
        status: false,
        message: ACCOUNT_HAD_NOT_PASSWORD_YET,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async getCurrentUser(userId: number): Promise<Users> {
    return this.usersRepository.findById(userId, {
      ...userInfoQuery(false),
    });
  }

  async getUserById(targetUserId: number, userId: number, ignoreCheckIsBlocked?: boolean): Promise<AnyObject> {
    const isBlocked = ignoreCheckIsBlocked
      ? false
      : await this.usersBlockHandler.checkBlockedByUserId(userId, targetUserId);
    const isBlockedByAdmin = await this.usersRepository.count({
      id: targetUserId,
    });
    if (isBlocked || !isBlockedByAdmin.count) {
      throw new HttpErrors.NotAcceptable(ErrorCode.USER_NOT_AVAILABLE);
    }
    const [targetUser, totalPost, followingIds, followerIds] = await Promise.all([
      this.usersRepository.findById(targetUserId, {
        ...userInfoQueryWithFlagFollow(true, userId),
        include: [
          ...userInfoQueryWithFlagFollow(!(userId === targetUserId), userId).include,
          {
            relation: 'follows',
            scope: {
              where: {
                userId: targetUserId,
                followingId: userId,
              },
            },
          },
        ],
      }),
      this.postsRepository.count({
        creatorId: targetUserId,
        accessType: {
          inq: userId === targetUserId ? POST_ACCESS_TYPES : [POST_ACCESS_TYPE_PUBLIC, POST_ACCESS_TYPE_FOLLOW],
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        blockedAt: null,
        status: PostStatusEnum.public,
        showOnProfile: true,
      }),
      this.followRepository.getListFollowingById(targetUserId),
      this.followRepository.getListFollowerById(targetUserId),
    ]);
    const [totalFollowing, totalFollower] = await Promise.all([
      this.usersRepository.count({
        id: {
          inq: followingIds,
        },
      }),
      this.usersRepository.count({
        id: {
          inq: followerIds,
        },
      }),
    ]);
    if (targetUser?.follows && targetUser?.follows.length) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      targetUser.follower = targetUser?.follows[0];
    }
    const followStatus = targetUser.following && targetUser.following.length ? targetUser.following[0] : null;
    return {
      ...targetUser,
      followed: Boolean(followStatus),
      followStatus: followStatus ? followStatus.followStatus : '',
      totalPost: totalPost.count,
      totalFollowing: totalFollowing.count,
      totalFollower: totalFollower.count,
    };
  }

  async changePassword(
    data: {
      curPassword: string;
      newPassword: string;
    },
    userId: number,
  ): Promise<{message: string}> {
    try {
      const me = await this.usersRepository.findById(userId, {
        include: [
          {
            relation: 'email',
          },
        ],
      });
      const cre = {
        email: get(me, 'email.email', ''),
        password: data.curPassword,
      };

      await this.userService.verifyCredentials(cre);
      const newForm = {
        email: get(me, 'email.email', ''),
        password: data.newPassword,
      };
      validateCredentials(pick(newForm, ['email', 'password']));
      const newPassword = await this.passwordHasher.hashPassword(data.newPassword);
      await this.usersRepository.usercredentials(me.id).delete();
      await this.usersRepository.usercredentials(me.id).create({password: newPassword});
      return {
        message: USER_MESSAGE_UPDATE_PASSWORD_SUCCESS,
      };
    } catch (error) {
      if (error.message === ErrorCode.INVALID_EMAIL_OR_PASSWORD) {
        throw new HttpErrors.BadRequest(CURRENT_PASSWORD_INCORRECT);
      }
      throw new HttpErrors.BadRequest(USER_MESSAGE_UPDATE_PASSWORD_FAIL);
    }
  }

  async getListDeviceToken(data: {userIds: number[]}): Promise<AnyObject[]> {
    const result = await this.deviceInfoRepository.find({
      where: {
        userId: {
          inq: data?.userIds || [],
        },
      },
    });

    return result
      .map(function (item) {
        return {
          deviceToken: item.deviceToken || '',
          language: item.language || LANGUAGES.EN,
        };
      })
      .filter((item) => item);
  }

  generateVerifyCode(): string {
    const string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let OTP = '';

    // Find the length of string
    const len = string.length;
    for (let i = 0; i < 6; i++) {
      OTP += string[Math.floor(Math.random() * len)];
    }
    return String(OTP).toUpperCase();
  }

  async sendEmailVerify(email?: string, name?: string, code?: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await this.emailSv.sendMail({
      to: email,
      subject: 'jGooooo Account Verification',
      html: verifyCodeEmail({
        name: name,
        code: code,
      }),
    });
    return true;
  }

  async generateDataLogin(
    user: Users,
    deviceToken?: string,
    language?: string,
    macAddress?: string,
    ipAddress?: string,
    brand?: string,
    model?: string,
    systemVersion?: string,
  ): Promise<{token: string; current_user: Users}> {
    try {
      // convert a User object into a UserProfile object (reduced set of properties)
      const targetUser = await this.usersRepository.findById(user.id, {
        include: [
          {
            relation: 'email',
          },
        ],
      });
      if (!_.isNull(targetUser.blockedAt)) {
        throw new HttpErrors.Forbidden(ACCOUNT_HAS_BEEN_BLOCKED);
      }
      const userProfile = this.userService.convertToUserProfile(targetUser);
      const userId = parseInt(userProfile[securityId]);
      // create a JSON Web Token based on the user profile
      const token = await this.jwtService.generateToken(userProfile);
      const currentUser = await this.usersRepository.findById(userId, {
        ...userInfoQuery(false),
      });
      if (deviceToken) {
        await this.deviceInfoRepository.deleteAll({
          deviceToken: deviceToken,
        });
        await this.usersRepository.deviceInfos(userId).create({
          deviceToken: deviceToken,
          language: language || LANGUAGES.EN,
          macAddress: macAddress || '',
          ipAddress: ipAddress || '',
          brand: brand || '',
          model: model || '',
          systemVersion: systemVersion || '',
        });
      }
      return {
        token: token,
        current_user: currentUser,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async updateLanguage(userId: number, deviceToken: string, language: string) {
    await this.usersRepository.deviceInfos(userId).patch(
      {
        language: language,
      },
      {
        deviceToken: deviceToken,
      },
    );

    return {
      message: USER_MESSAGE_UPDATE_LANGUAGE_SUCCESS,
    };
  }

  async checkExistEmail(email: string): Promise<boolean> {
    const isExist = await this.userEmailRepository.findOne({
      where: {
        email,
      },
    });
    return Boolean(isExist);
  }

  async checkExistUsername(username: string): Promise<boolean> {
    const isExist = await this.usersRepository.findOne({
      where: {
        username,
      },
    });
    return Boolean(isExist);
  }

  async recommendFriends(
    filter: AnyObject,
    userId: number,
  ): Promise<{
    count: number;
    data: UserWithRecommend[];
  }> {
    const [listBlocker, listFollowing, listUserIdFollowing] = await Promise.all([
      this.usersBlockHandler.getListUserBlockIds(userId),
      this.followRepository.find({
        fields: {
          followingId: true,
        },
        where: {
          userId: userId,
          followStatus: {
            inq: [FOLLOW_STATUS_ACCEPTED, FOLLOW_STATUS_REQUESTED],
          },
        },
      }),
      this.followRepository.find({
        fields: {
          userId: true,
        },
        where: {
          followingId: userId,
          followStatus: FOLLOW_STATUS_ACCEPTED,
        },
      }),
    ]);

    // Danh sách những người mình đang follow
    const listFollowingIds = listFollowing.map((user: Follow) => user.followingId);

    // Danh sách những người đang follow mình
    const listUserIdFollowingIds = listUserIdFollowing.map((item: Follow) => item.userId);

    const [result, count] = await Promise.all([
      this.usersRepository.find({
        ...filter,
        include: [
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
        ],
        where: {
          ...filter?.where,
          userTypeAccess: {
            inq: [USER_TYPE_ACCESS_NORMAL, USER_TYPE_ACCESS_FACEBOOK, USER_TYPE_ACCESS_GOOGLE, USER_TYPE_ACCESS_APPLE],
          },
          id: {
            nin: [...listBlocker, ...listFollowingIds, userId],
          },
          isActive: true,
        },
      }),
      this.usersRepository.count({
        ...filter?.where,
        userTypeAccess: {
          inq: [USER_TYPE_ACCESS_NORMAL, USER_TYPE_ACCESS_FACEBOOK, USER_TYPE_ACCESS_GOOGLE, USER_TYPE_ACCESS_APPLE],
        },
        id: {
          nin: [...listBlocker, ...listFollowingIds, userId],
        },
        isActive: true,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        blockedAt: null,
      }),
    ]);

    const data: UserWithTotalPost[] = result.map((item: Users) => ({
      ...item,
      followed: listUserIdFollowingIds.includes(<number>item.id),
    }));

    return {
      count: count.count,
      data,
    };
  }
}
