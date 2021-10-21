// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

import {AnyObject, Count, Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {
  ConversationRepository,
  DeviceTokenRepository,
  MediaContentsRepository,
  MessageRepository,
  PageRepository,
  UsersBlockRepository,
  UsersRepository,
} from '../../repositories';
import {HttpErrors} from '@loopback/rest';
import {userInfoQuery} from '../specs/user-controller.specs';
import {Conversation, Message, Users, UsersBlock, UsersWithRelations} from '../../models';
import {v4 as uuidv4} from 'uuid';
import moment from 'moment';
import {
  AttachmentTypes,
  ConversationTypesConstant,
  MessageConstants,
  NOTIFICATION_TYPE_MESSAGE,
  TURN_OFF_NOTIFY_CONVERSATION_SUCCESS,
  TURN_ON_NOTIFY_CONVERSATION_SUCCESS,
} from '../../configs/message-constant';
import {get as path, omit} from 'lodash';
import {ConversationInterface, ConversationResponseInterface} from './messages.interface';
import {NotificationLogicController, userInfoQueryWithFlagFollow} from '..';
import {handleError} from '../../utils/handleError';
import {changeAlias} from '../../utils/handleString';
import _, {get as getProperty} from 'lodash';
import {ErrorCode} from '../../constants/error.constant';
import {inject} from '@loopback/context';
import {USER_TYPE_ACCESS_ADMIN, USER_TYPE_ACCESS_PAGE} from '../../configs/user-constants';
import {FirebaseService} from '../../services';
import {NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE} from '../../configs/notification-constants';
import {LANGUAGES} from '../../configs/utils-constant';

export class MessagesHandlerController {
  constructor(
    @repository(MessageRepository)
    public messageRepository: MessageRepository,
    @repository(ConversationRepository)
    public conversationRepository: ConversationRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(DeviceTokenRepository)
    public deviceInfoRepository: DeviceTokenRepository,
    @inject('firebase')
    public firebaseService: FirebaseService,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @repository(UsersBlockRepository)
    public usersBlockRepository: UsersBlockRepository,
  ) {}

  async getMessages(
    userId: number,
    filter?: Filter<Message>,
    userIds?: number[],
    conversationKey?: string,
  ): Promise<{
    count: number;
    message: AnyObject[];
    conversationId: string;
  }> {
    let conversation: Conversation | null;
    const key: string | undefined =
      conversationKey || (await this.generateKey(userIds ? [...userIds, userId] : [userId]));
    if (key) {
      conversation = await this.conversationRepository.findOne({
        where: {
          conversationKey: key,
        },
      });
      if (!conversation) {
        throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
      }
      const startViewConversation = this.getStartViewConversationTime(conversation, userId);
      const filterMessage: Filter<Message> = {
        ...filter,
        where: {
          ...(conversation.conversationType === ConversationTypesConstant.PAIR && startViewConversation
            ? {
                createdAt: {
                  gt: startViewConversation,
                },
              }
            : {}),
          // accessRead: {
          //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          //   // @ts-ignore
          //   elemMatch: {
          //     userId: userId,
          //   },
          // },
          conversationId: conversation.id,
        },
      };
      const count = await this.messageRepository.count(filterMessage.where, {
        strictObjectIDCoercion: true,
      });
      const contributors = await this.getListContributorInfo(
        conversation.contributors?.map((item: {userId: number}) => Number(item.userId)),
      );
      const messages = (
        await this.messageRepository.find(filterMessage, {
          strictObjectIDCoercion: true,
        })
      ).map((item: Message) => {
        return {
          ...item,
          user: contributors[contributors.findIndex((contributor) => contributor.id === item.userId)],
        };
      });
      for (const index in messages) {
        const message = messages[index];
        if (message?.attachments?.length) {
          const attachmentsId = message?.attachments.map((item: AnyObject) => item.id);
          messages[index].attachments = await this.mediaContentsRepository.find({
            where: {
              id: {
                inq: attachmentsId,
              },
            },
          });
        }
      }
      return {
        message: messages,
        count: count.count,
        conversationId: String(conversation.id),
      };
    }
    return {
      count: 0,
      message: [],
      conversationId: String(null),
    };
  }

  async getMessagesSystem(
    userId: number,
    filter?: Filter<Message>,
    conversationKey?: string,
  ): Promise<{
    count: number;
    message: AnyObject[];
  }> {
    let conversation: Conversation | null;
    const key: string | undefined = conversationKey || `${userId}-jGooooo`;
    if (key) {
      conversation = await this.conversationRepository.findOne({
        where: {
          conversationKey: key,
        },
      });
      if (!conversation) {
        throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
      }
      const filterMessageSystem: Filter<Message> = {
        ...filter,
        where: {
          messageType: MessageConstants.systemMessage,
          conversationId: conversation.id,
        },
      };
      const count = await this.messageRepository.count(filterMessageSystem.where, {strictObjectIDCoercion: true});
      const messages = await this.messageRepository.find(filterMessageSystem, {
        strictObjectIDCoercion: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleReadMessage(conversation, {userId: userId});
      return {
        count: count.count,
        message: messages,
      };
    }
    return {
      count: 0,
      message: [],
    };
  }

  async createConversation(userId: number, userIdsIncludeUserId: number[]): Promise<Conversation> {
    const key = await this.generateKey(userIdsIncludeUserId);
    if (key) {
      const result = await this.conversationRepository.findOne({
        where: {
          conversationKey: key,
        },
      });
      if (result) {
        return result;
      }
    }
    let newKey: string;
    if (userIdsIncludeUserId.length === 2) {
      newKey = userIdsIncludeUserId
        .sort((a, b) => {
          return a - b;
        })
        .join('-');
    } else {
      newKey = uuidv4();
    }
    const readAt: AnyObject = {};
    const notify: AnyObject = {};
    const timeInitConversation = moment().utc().toISOString();
    userIdsIncludeUserId.map((item) => {
      readAt[item] = timeInitConversation;
      notify[item] = true;
    });
    const conversationType =
      userIdsIncludeUserId.length === 2 ? ConversationTypesConstant.PAIR : ConversationTypesConstant.GROUP;
    const result = await this.conversationRepository.create({
      conversationKey: newKey,
      readAt: readAt,
      participants: [
        ...userIdsIncludeUserId.map((item) => {
          return {
            userId: item,
          };
        }),
      ],
      accessRead: [
        ...userIdsIncludeUserId.map((item) => {
          return {
            userId: item,
          };
        }),
      ],
      accessWrite: [
        ...userIdsIncludeUserId.map((item) => {
          return {
            userId: item,
          };
        }),
      ],
      notify: notify,
      conversationType: conversationType,
      ...(conversationType === ConversationTypesConstant.GROUP
        ? {
            adminList: [userId],
          }
        : {}),
      contributors: [
        ...userIdsIncludeUserId.map((item) => {
          return {
            userId: item,
          };
        }),
      ],
      createdAt: timeInitConversation,
      updatedAt: timeInitConversation,
    });
    await this.handleUpdateDataConverationToElasticSearch(result);
    return result;
  }

  async findConversations({
    userId,
    filter,
    q,
    showConversationSystem,
  }: {
    userId: number;
    filter?: Filter<Conversation>;
    q?: string;
    showConversationSystem?: boolean;
  }): Promise<{
    data: ConversationResponseInterface[];
    count: number;
  }> {
    let total = 0;
    let newFilter: Filter<Conversation> = {
      order: ['updatedAt DESC'],
      ...filter,
      where: {
        conversationType: {
          nin: [ConversationTypesConstant.SYSTEM],
        },
        ...filter?.where,
        accessRead: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          elemMatch: {
            userId,
          },
        },
      },
    };
    if (q?.length) {
      const {conversationIds} = await this.handleSearchConversation({
        userId,
        filter,
        q,
      });
      newFilter = {
        ...newFilter,
        order: ['conversationType DESC'],
        where: {
          conversationType: {
            nin: [ConversationTypesConstant.SYSTEM],
          },
          ...newFilter.where,
          id: {
            inq: conversationIds,
          },
        },
      };
    }
    const [conversations, count] = await Promise.all([
      this.conversationRepository.find(newFilter),
      this.conversationRepository.count(newFilter.where),
    ]);
    total = count.count || total;
    let data = await Promise.all(
      conversations.map(async (conversation) => {
        return this.convertConversation({
          conversation,
          userId,
        });
      }),
    );
    if (showConversationSystem && JSON.parse(String(showConversationSystem).toLowerCase())) {
      let filterMessageSystem: Filter<Conversation> = {
        order: ['updatedAt DESC'],
        where: {
          conversationKey: `${userId}-jGooooo`,
          conversationType: ConversationTypesConstant.SYSTEM,
        },
      };
      if (q?.length) {
        const {conversationIds} = await this.handleSearchConversation({
          userId,
          filter,
          q,
        });
        filterMessageSystem = {
          ...filterMessageSystem,
          where: {
            ...filterMessageSystem.where,
            id: {
              inq: conversationIds,
            },
          },
        };
      }
      const [conversationSystem, countSystem] = await Promise.all([
        this.conversationRepository.find(filterMessageSystem),
        this.conversationRepository.count(filterMessageSystem.where),
      ]);
      const dataSystem = await Promise.all(
        conversationSystem.map(async (conversation) => {
          return this.convertConversation({
            conversation,
            userId,
          });
        }),
      );
      data = [...dataSystem, ...data];
      total += countSystem.count;
    }
    return {
      data,
      count: total,
    };
  }

  async getCountUnread({userId}: {userId: number}): Promise<Count> {
    const newFilter: Filter<Conversation> = {
      order: ['updatedAt DESC'],
      where: {
        accessRead: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          elemMatch: {
            userId,
          },
        },
      },
    };
    const conversations = await this.conversationRepository.find(newFilter);
    let countUnread = 0;
    conversations.map((item) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      if (moment(item?.updatedAt).isAfter(moment(item?.readAt[String(userId)]))) {
        countUnread += 1;
      } else {
        if (item.conversationType === ConversationTypesConstant.SYSTEM && _.isEmpty(item.readAt)) {
          countUnread += 1;
        }
      }
    });
    return {
      count: countUnread,
    };
  }

  async handleSearchConversation({
    userId,
    filter,
    q,
  }: {
    userId: number;
    filter?: Filter<Conversation>;
    q?: string;
  }): Promise<{
    conversationIds: string[];
    count: number;
  }> {
    const must = [];
    must.push({
      match: {
        'accessRead.userId': userId,
      },
    });
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['accessRead.name', 'conversationName'],
        },
      });
    }
    const body: AnyObject = {
      // sort: parseOrderToElasticSort(filter?.order || ['']),
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: must,
        },
      },
    };

    const searchResult = await this.conversationRepository.elasticService.get(body);
    const count = getProperty(searchResult, 'body.hits.total.value', 0);
    let hit = getProperty(searchResult, 'body.hits.hits', []);
    // xử lý get conversation khác chính mình
    if (q?.length) {
      hit = hit
        .filter((item: any) => {
          if (item._source.accessRead.length <= 2) {
            if (
              item._source.accessRead.find(
                (subItem: any) => subItem.name.includes(changeAlias(q)) && subItem.userId === userId,
              )
            )
              return false;
          }
          return true;
        })
        .map((need: any) => need);
    }

    const getIdFromHit = (item: {
      _source: {
        id: string;
      };
    }) => {
      return item._source.id || '';
    };
    const conversationIds = Array.from(hit, getIdFromHit);
    return {
      conversationIds,
      count: count,
    };
  }

  async convertConversation({
    conversation,
    userId,
  }: {
    conversation?: Conversation;
    userId: number;
  }): Promise<ConversationResponseInterface> {
    const readAt = String(path(conversation, ['readAt', String(userId)]) || conversation?.createdAt);
    const [contributors, participants] = await Promise.all([
      this.getListContributorInfo(conversation?.contributors?.map((contributor: AnyObject) => contributor.userId)),
      this.getListContributorInfo(conversation?.participants?.map((contributor: AnyObject) => contributor.userId)),
    ]);

    const listMessage = (
      await this.messageRepository.find(
        {
          order: ['createdAt DESC'],
          where: {
            messageType: {
              nin: [
                MessageConstants.renameConversationMessage,
                MessageConstants.removeUserFromConversationMessage,
                MessageConstants.addUserToConversationMessage,
                MessageConstants.leaveConversationMessage,
                MessageConstants.deleteMessage,
                MessageConstants.assignAdmin,
              ],
            },
            // accessRead: {
            //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            //   // @ts-ignore
            //   elemMatch: {
            //     userId,
            //   },
            // },
          },
        },
        {strictObjectIDCoercion: true},
      )
    ).filter((item: Message | undefined) => item?.conversationId === conversation?.id);
    const lastestMessage: Message | undefined = _.head(listMessage);

    const listUnRead = (
      await this.messageRepository.find(
        {
          where: {
            messageType: {
              nin: [
                MessageConstants.renameConversationMessage,
                MessageConstants.removeUserFromConversationMessage,
                MessageConstants.addUserToConversationMessage,
                MessageConstants.leaveConversationMessage,
                MessageConstants.deleteMessage,
                MessageConstants.assignAdmin,
              ],
            },
            createdAt: {
              gt: readAt,
            },
          },
        },
        {strictObjectIDCoercion: true},
      )
    ).filter((item) => item.conversationId === conversation?.id);
    const countUnRead = _.differenceWith(listUnRead, [userId], _.isEqual);
    const targetUser =
      conversation?.conversationType === ConversationTypesConstant.PAIR &&
      conversation.accessRead?.find((item) => item.userId !== userId)?.userId;
    const blockStatus = targetUser ? await this.getStatusBlocked(userId, targetUser) : {};
    const listParticipantJoin = participants.filter((item: AnyObject) => item.id !== userId);
    const conversationName = conversation?.conversationName
      ? conversation.conversationName
      : listParticipantJoin.length > 0
      ? listParticipantJoin.map((user: AnyObject) => user.name).join(', ')
      : participants[0].name;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
      ...conversation,
      participants,
      countUnRead: countUnRead.length,
      blockStatus: blockStatus,
      lastestMessage,
      contributors,
      conversationName,
    };
  }

  async getStatusBlocked(
    userId: number,
    targetId: number,
  ): Promise<{isBlockedTargetUser: boolean; isTargetUserBlockedMe: boolean}> {
    const [isBlockedTargetUser, isTargetUserBlockedMe] = await Promise.all([
      this.usersBlockRepository.findOne({
        where: {
          userId: targetId,
          creatorId: userId,
        },
      }),
      this.usersBlockRepository.findOne({
        where: {
          userId,
          creatorId: targetId,
        },
      }),
    ]);
    return {
      isBlockedTargetUser: !!isBlockedTargetUser,
      isTargetUserBlockedMe: !!isTargetUserBlockedMe,
    };
  }

  async findConversationById(
    userId: number,
    conversationId: string,
    filter?: FilterExcludingWhere<Message>,
  ): Promise<ConversationInterface> {
    const [result, count] = await Promise.all([
      this.conversationRepository.findById(conversationId, filter),
      (await this.messageRepository.find({}, {strictObjectIDCoercion: true})).filter(
        (item) => item.conversationId === conversationId,
      ),
    ]);
    const conver = await this.convertConversation({
      conversation: result,
      userId,
    });
    const isNotify = !!path(result, ['notify', userId]);
    const targetUser =
      result?.conversationType === ConversationTypesConstant.PAIR &&
      result.accessRead?.find((item) => item.userId !== userId)?.userId;
    const blockStatus = targetUser ? await this.getStatusBlocked(userId, targetUser) : {};
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
      ...conver,
      totalMessages: count.length,
      isNotify: isNotify,
      blockStatus: blockStatus,
    };
  }

  async setConversationName(
    conversationId: string,
    userId: number,
    request: {
      conversationName: string;
    },
  ): Promise<Conversation> {
    const targetConverSation = await this.conversationRepository.findById(conversationId);
    if (!targetConverSation.participants?.filter((item: AnyObject) => item.userId === userId).length) {
      throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
    }
    await this.conversationRepository.updateById(conversationId, {
      conversationName: request.conversationName,
    });

    const messageNotification: any = {
      message: '',
      messageType: MessageConstants.renameConversationMessage,
      conversationId: conversationId,
      otherInfo: {
        conversationName: request.conversationName,
      },
    };
    await this.createMessage(userId, messageNotification);

    const result = await this.conversationRepository.findById(conversationId);
    await this.handleUpdateDataConverationToElasticSearch(result);
    return result;
  }

  async addUserToConversation(
    userId: number,
    conversationId: string,
    request: {
      listUser: number[];
    },
  ): Promise<Conversation> {
    try {
      const target = await this.conversationRepository.findById(conversationId);
      const participants = Array.from(
        new Set([...target.participants.map((item) => item.userId), ...request.listUser]),
        (item) => {
          return {
            userId: item,
          };
        },
      );
      const accessWrite = Array.from(
        new Set([...target.accessWrite.map((item) => item.userId), ...request.listUser]),
        (item) => {
          return {
            userId: item,
          };
        },
      );
      const accessRead = Array.from(
        new Set([...target.accessRead.map((item) => item.userId), ...request.listUser]),
        (item) => {
          return {
            userId: item,
          };
        },
      );
      const notify: object = target.notify || {};
      request.listUser.map((item: number) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        notify[String(item)] = true;
      });
      const readAt: object = target.readAt || {};
      request.listUser.map((item: number) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        readAt[String(item)] = target.createdAt;
      });
      const contributors = Array.from(
        new Set([...(target.contributors || []).map((item) => item.userId), ...request.listUser]),
        (item) => {
          return {
            userId: item,
          };
        },
      );
      await this.conversationRepository.updateById(conversationId, {
        participants,
        accessWrite,
        accessRead,
        notify,
        contributors,
        readAt,
      });

      for (let index = 0; index < request.listUser.length; index++) {
        const userInfo = await this.usersRepository.findById(request.listUser[index]);
        const messageNotification: any = {
          message: '',
          messageType: MessageConstants.addUserToConversationMessage,
          conversationId: conversationId,
          accessRead: [
            {
              userId: request.listUser[index],
            },
          ],
          otherInfo: {
            userName: userInfo.name,
            userId: request.listUser[index],
          },
        };
        await this.createMessage(userId, messageNotification);
      }

      const result = await this.conversationRepository.findById(conversationId);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.handleUpdateDataConverationToElasticSearch(result);
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async removeUserFromConversation(
    userId: number,
    conversationId: string,
    request: {
      listUser: number[];
    },
  ): Promise<Conversation> {
    try {
      const listUser = request?.listUser;
      for (let index = 0; index < listUser.length; index++) {
        const userInfo = await this.usersRepository.findById(listUser[index]);
        const messageNotification: any = {
          message: '',
          messageType:
            listUser[index] === userId
              ? MessageConstants.leaveConversationMessage
              : MessageConstants.removeUserFromConversationMessage,
          conversationId: conversationId,
          otherInfo: {
            userName: userInfo.name,
            userId: listUser[index],
          },
        };
        await this.createMessage(userId, messageNotification);
      }

      const target = await this.conversationRepository.findById(conversationId);
      const participants = this.handleRemoveUserFromList([...target.participants], listUser);
      const accessWrite = this.handleRemoveUserFromList([...target.accessWrite], listUser);
      const accessRead = this.handleRemoveUserFromList([...target.accessRead], listUser);
      const notify: object = omit(
        target.notify,
        request.listUser.map((item) => String(item)),
      );
      const readAt: AnyObject = omit(
        target.readAt,
        request.listUser.map((item) => String(item)),
      );
      await this.conversationRepository.updateById(conversationId, {
        participants,
        accessWrite,
        accessRead,
        notify,
        readAt,
      });
      const result = await this.conversationRepository.findById(conversationId);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.handleUpdateDataConverationToElasticSearch(result);
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteMessageById(
    userId: number,
    messageId: string,
  ): Promise<{
    success: boolean;
  }> {
    try {
      const targetMessage = await this.messageRepository.findById(messageId);
      const targetConversation = await this.conversationRepository.findById(targetMessage.conversationId);
      const readAtList: any = targetConversation.readAt;
      const messageReaded = Object.keys(readAtList).reduce((result, key) => {
        const targetDateReadAt = moment(readAtList[key]).format('YYYY-MM-DD hh:mm:ss');
        const targetDateCreatAt = moment(targetMessage.createdAt).format('YYYY-MM-DD hh:mm:ss');
        if (Number(key) !== userId && moment(targetDateReadAt).isSameOrAfter(targetDateCreatAt)) {
          return true;
        }
        return result;
      }, false);
      if (!messageReaded) {
        await this.messageRepository.updateById(messageId, {
          message: '',
          attachments: [],
          postId: 0,
          messageType: MessageConstants.deleteMessage,
        });
        return {
          success: true,
        };
      } else {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteConversationById(
    userId: number,
    conversationId: string,
  ): Promise<{
    success: boolean;
  }> {
    try {
      const targetConversation = await this.conversationRepository.findById(conversationId);
      const deletedConversations = (targetConversation.deletedConversations || []).filter(
        (item: AnyObject) => item.userId !== userId,
      );
      deletedConversations.push({
        userId,
        deletedAt: moment().utc().toISOString(),
      });
      await this.conversationRepository.updateById(conversationId, {
        accessRead: [...(targetConversation?.accessRead || []).filter((item) => item.userId !== userId)],
        deletedConversations,
      });
      const result = await this.conversationRepository.findById(conversationId);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.handleUpdateDataConverationToElasticSearch(result);
      return {
        success: true,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async getAttachments(
    userId: number,
    conversationId: string,
    attachType: string,
    filter?: Filter<Message>,
  ): Promise<{
    data: AnyObject[];
    count: number;
  }> {
    try {
      const targetConversation = await this.conversationRepository.findById(conversationId);
      if (targetConversation?.participants) {
        const listParticipant = targetConversation?.participants.map((item: AnyObject) => item.userId);
        if (!listParticipant.includes(userId)) {
          throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
        }
      }
      const startTime = this.getStartViewConversationTime(targetConversation, userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notificationCollection = (this.messageRepository.dataSource.connector as any).collection('Message');
      if (attachType === AttachmentTypes.image || attachType === AttachmentTypes.video) {
        const options = [
          {
            $match: {
              conversationId: String(targetConversation.id),
              messageType: MessageConstants.attachFileMessage,
              // accessRead: {
              //   $elemMatch: { userId }
              // },
              ...(targetConversation.conversationType === ConversationTypesConstant.PAIR && startTime
                ? {
                    createdAt: {
                      $gte: startTime,
                    },
                  }
                : {}),
            },
          },
          {
            $unwind: '$attachments',
          },
          {
            $match: {
              'attachments.resourceType': attachType,
            },
          },
        ];
        const [data, count] = await Promise.all([
          notificationCollection
            .aggregate([
              ...options,
              {$skip: 0},
              {$limit: 10000},
              {
                $sort: {createdAt: -1, id: -1},
              },
            ])
            .get(),
          notificationCollection
            .aggregate([
              ...options,
              {
                $count: 'count',
              },
            ])
            .get(),
        ]);
        const listAttachment = data.map((item: AnyObject) => item?.attachments?.id).filter((item: number) => item);
        const attachments = await this.mediaContentsRepository.find({
          order: ['createdAt DESC, id DESC'],
          where: {
            id: {
              inq: listAttachment,
            },
          },
        });
        return {
          data: attachments,
          count: count[0]?.count || 0,
        };
      }
      if (attachType === AttachmentTypes.link) {
        const startViewConversation = this.getStartViewConversationTime(targetConversation, userId);
        const filterMessage: Filter<Message> = {
          ...filter,
          include: [
            {
              relation: 'user',
            },
          ],
          where: {
            ...(targetConversation.conversationType === ConversationTypesConstant.PAIR && startViewConversation
              ? {
                  createdAt: {
                    gt: startViewConversation,
                  },
                }
              : {}),
            // accessRead: {
            //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            //   // @ts-ignore
            //   elemMatch: {
            //     userId: userId,
            //   },
            // },
            messageType: MessageConstants.linkMessage,
            conversationId: targetConversation.id,
          },
        };
        const data = await this.messageRepository.find(filterMessage, {
          strictObjectIDCoercion: true,
        });
        const count = await this.messageRepository.count(filterMessage.where, {
          strictObjectIDCoercion: true,
        });
        return {
          count: count.count,
          data: data.map((message) => {
            const result = {
              ...message,
              messageId: message.id,
            };
            delete result.id;
            return result;
          }),
        };
      }
      return {
        data: [],
        count: 0,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async getListUserRecently({
    userId,
    filter,
    q,
  }: {
    userId: number;
    filter?: Filter<Users>;
    q?: string;
  }): Promise<{
    count: number;
    data: Users[];
  }> {
    try {
      let total = 0;
      let newFilter: Filter<Conversation> = {
        order: ['updatedAt DESC'],
        limit: 10,
        where: {
          conversationType: ConversationTypesConstant.PAIR,
          accessRead: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            elemMatch: {
              userId,
            },
          },
        },
      };
      if (q?.length) {
        const {conversationIds, count} = await this.handleSearchConversation({
          userId,
          filter: {
            where: {
              conversationType: ConversationTypesConstant.PAIR,
            },
          },
          q,
        });
        newFilter = {
          ...newFilter,
          where: {
            ...newFilter.where,
            id: {
              inq: conversationIds,
            },
          },
        };
        total = count;
      }
      const top10conversationNewest = await this.conversationRepository.find(newFilter);
      let listUserIds: number[] = [];
      top10conversationNewest.map((conversation: Conversation) => {
        const listUserIdExcludeMe = conversation?.participants
          ?.map((user: AnyObject) => {
            if (user?.userId !== userId) {
              return user?.userId;
            }
          })
          .filter((item) => item);
        listUserIds = [...listUserIds, ...(listUserIdExcludeMe || [])];
      });
      const listUserIdResult = Array.from(new Set(listUserIds));
      const usersResult = await this.usersRepository.find({
        ...userInfoQueryWithFlagFollow(true, userId),
        ...filter,
        where: {
          id: {
            inq: listUserIdResult,
          },
        },
      });
      return {
        count: total || listUserIdResult.length,
        data: usersResult,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  // additional function

  async generateKey(userIds: number[]): Promise<string | undefined> {
    if (!userIds.length || userIds.length === 1) {
      throw new HttpErrors.BadRequest(ErrorCode.KEY_OR_LIST_USER_ID_IS_REQUIRED);
    } else {
      if (userIds.length === 2) {
        return userIds
          .sort((a, b) => {
            return a - b;
          })
          .join('-');
      } else {
        const conversationExist = await this.conversationRepository.findOne({
          where: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            and: [
              ...userIds.map((id) => {
                return {
                  accessRead: {
                    elemMatch: {
                      userId: id,
                    },
                  },
                };
              }),
            ],
          },
        });
        if (conversationExist) {
          // TODO: return conversation exist when create new (key -> conversationKey)
          return conversationExist.key;
        } else {
          return undefined;
        }
      }
    }
  }

  async getListContributorInfo(userIds: (number | undefined)[] | undefined): Promise<UsersWithRelations[]> {
    if (!userIds || !userIds?.length) {
      return [];
    }
    return this.usersRepository.find({
      where: {
        id: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          inq: userIds.filter((item) => item),
        },
      },
      ...userInfoQuery(true),
    });
  }

  getStartViewConversationTime(conversation: Conversation, userId: number) {
    const deletedConversations = conversation.deletedConversations;
    if (deletedConversations?.length) {
      for (const index in deletedConversations) {
        const item: AnyObject = deletedConversations[index];
        if (item.userId === userId && item.deletedAt) {
          return item.deletedAt;
        }
      }
    }
    return conversation.createdAt;
  }

  handleRemoveUserFromList(targetList: {userId: number}[], listUserRemove: number[]) {
    return Array.from(new Set([...targetList?.map((item) => item.userId)]), (item) => {
      return {
        userId: item,
      };
    }).filter((item) => !listUserRemove.includes(item.userId));
  }

  async blockUser(userId: number, targetUserId: number): Promise<void> {
    const conversationKey = [userId, targetUserId]
      .sort((a, b) => {
        return a - b;
      })
      .join('-');
    const targetConversation = await this.conversationRepository.findOne({
      where: {
        conversationKey,
      },
    });

    if (targetConversation?.id) {
      await this.conversationRepository.updateById(targetConversation?.id, {
        accessWrite: [],
      });
    } else {
      throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
    }
  }

  async unBlockUser(userId: number, targetUserId: number): Promise<void> {
    const conversationKey = [userId, targetUserId]
      .sort((a, b) => {
        return a - b;
      })
      .join('-');
    const targetConversation = await this.conversationRepository.findOne({
      where: {
        conversationKey,
      },
    });

    if (targetConversation?.id) {
      await this.conversationRepository.updateById(targetConversation?.id, {
        accessWrite: targetConversation.participants,
      });
    } else {
      throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
    }
  }

  async handleSetNotificationStatus(
    userId: number,
    conversationId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const targetConversation = await this.conversationRepository.findById(conversationId);
      if (targetConversation?.participants?.filter((item: AnyObject) => item.userId === userId).length) {
        const notifyStatus = getProperty(targetConversation, ['notify', userId], false);
        const notify = {
          ...targetConversation.notify,
          [userId]: !notifyStatus,
        };
        await this.conversationRepository.updateById(conversationId, {
          notify,
        });
        return {
          success: true,
          message: !notifyStatus ? TURN_ON_NOTIFY_CONVERSATION_SUCCESS : TURN_OFF_NOTIFY_CONVERSATION_SUCCESS,
        };
      }
      throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
    } catch (e) {
      return handleError(e);
    }
  }

  async handleUpdateDataConverationToElasticSearch(converation: Conversation): Promise<void> {
    try {
      /**
       * GET list user participant
       */
      const listUserParticipant = await this.getListContributorInfo(
        converation.participants?.map((item: AnyObject) => item.userId).filter((item) => item),
      );

      /**
       * Participant
       */

      const participant = listUserParticipant.map((item) => {
        return {
          userId: item.id,
          name: changeAlias(item.name),
        };
      });

      /**
       * AccessRead
       */
      const accessReadUserIds = converation.accessRead?.map((item: AnyObject) => item.userId).filter((item) => item);
      const accessRead = participant.filter((item) => accessReadUserIds?.includes(item.userId));

      /**
       * generate result elastic search
       */
      const result = {
        id: converation.id,
        accessRead,
        conversationName: changeAlias(converation?.conversationName || ''),
        updatedAt: converation.updatedAt,
      };
      await this.conversationRepository.elasticService.create(result);
    } catch (e) {
      return handleError(e);
    }
  }

  async find(filter?: Filter<Conversation>): Promise<Conversation[]> {
    return this.conversationRepository.find(filter);
  }

  async setAdminConversation({
    conversationId,
    userId,
    newAdminId,
  }: {
    conversationId: string;
    userId: number;
    newAdminId: number;
  }): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findById(conversationId);
      const listParticipantId = conversation?.participants?.map((item: AnyObject) => item.userId);
      if (conversation?.adminList?.includes(userId) && listParticipantId?.includes(newAdminId)) {
        await this.conversationRepository.updateById(conversationId, {
          adminList: [newAdminId],
        });
        const newAdminInfo = await this.usersRepository.findById(newAdminId);
        const messageNotification: any = {
          message: '',
          messageType: MessageConstants.assignAdmin,
          conversationId: conversationId,
          otherInfo: {
            userName: newAdminInfo.name,
            userId: newAdminId,
          },
        };
        await this.createMessage(userId, messageNotification);
        return await this.conversationRepository.findById(conversationId);
      }
      throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
    } catch (e) {
      return handleError(e);
    }
  }

  async createMessage(
    userId: number,
    data: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    flagUpdateConversation?: boolean,
  ): Promise<Message> {
    try {
      const conversation = await this.conversationRepository.findById(data.conversationId);
      if (conversation?.id) {
        const userAccessWrite = conversation?.accessWrite?.map(({userId: userIdItem}: {userId: number}) => userIdItem);
        if (!userAccessWrite?.includes(userId)) {
          throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        await this.addUserToConversationIfDeleted(conversation.id);
        const result = await this.messageRepository.create({
          ...data,
          conversationId: String(data.conversationId),
          userId: userId,
          message: data.message || '',
          accessRead: data.accessRead ? data.accessRead : conversation?.accessRead,
          messageType: data.messageType,
        });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleNotificationMessage(result);
        // update time conversation
        flagUpdateConversation &&
          (await this.conversationRepository.updateById(conversation.id, {
            updatedAt: moment().utc().toISOString(),
          }));

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleReadMessage(conversation, {userId: userId});
        return result;
      } else {
        throw new HttpErrors.NotFound(ErrorCode.CONVERSATION_NOT_FOUND);
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async handleReadMessage(conversation: Conversation, data: {userId: number; readAt?: string}) {
    await this.conversationRepository.updateById(conversation.id, {
      readAt: {
        ...(conversation.readAt || {}),
        [String(data.userId)]: moment().utc().toISOString(),
      },
    });
  }

  async addUserToConversationIfDeleted(conversationId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (
      conversation?.accessRead?.length !== conversation?.participants?.length ||
      conversation?.accessWrite?.length !== conversation?.participants?.length
    ) {
      try {
        await this.conversationRepository.updateById(conversation.id, {
          accessRead: conversation.participants?.map((item: AnyObject) => {
            return {
              userId: item.userId,
            };
          }),
          // TODO: Add access write permission to conversation
          accessWrite: conversation.participants?.map((item: AnyObject) => {
            return {
              userId: item.userId,
            };
          }),
        });
      } catch (e) {
        return handleError(e);
      }
    }
  }

  async handleNotificationMessage(message: Message) {
    try {
      const conversation = await this.conversationRepository.findById(message.conversationId);
      const user =
        message.messageType === MessageConstants.systemMessage
          ? await this.usersRepository.findOne(
              {
                where: {
                  userTypeAccess: USER_TYPE_ACCESS_ADMIN,
                },
              },
              {
                ...userInfoQuery(false),
              },
            )
          : await this.usersRepository.findById(message.userId, {
              ...userInfoQuery(false),
            });
      const listUserSendNotify =
        message.messageType === MessageConstants.systemMessage
          ? message?.accessRead?.map((item) => item.userId).filter((item) => item)
          : message.messageType === MessageConstants.addUserToConversationMessage
          ? message?.accessRead
              ?.map((item) => item.userId)
              .filter((item: number) => item !== user.id)
              .filter((item) => item)
          : conversation?.accessRead
              ?.map((item) => item.userId)
              .filter((item: number) => getProperty(conversation, ['notify', String(item)]))
              .filter((item: number) => item !== user.id)
              .filter((item) => item);
      const listUserSendNotifyInfo = await this.usersRepository.find({
        where: {
          id: {
            inq: [...(listUserSendNotify || [])],
          },
        },
      });
      const image = String(path(user, ['profiles', 'avatars', 'mediaContent', 'url']));
      // eslint-disable-next-line no-unused-expressions
      listUserSendNotifyInfo.map((item) => {
        if (item.id) {
          if (item.userTypeAccess === USER_TYPE_ACCESS_PAGE) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.sendNotificationForPage(item.id, conversation.id || '');
          } else {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.sendNotifyMessage(message, image, [item.id], conversation, user);
          }
        }
      });
    } catch (e) {
      return handleError(e);
    }
  }

  async sendNotifyMessage(
    message: Message,
    image: string,
    userIds: number[],
    conversation: Conversation,
    user: Users,
  ): Promise<void> {
    const listSkipNotify: string[] = [
      MessageConstants.removeUserFromConversationMessage,
      MessageConstants.leaveConversationMessage,
      MessageConstants.deleteMessage,
      MessageConstants.assignAdmin,
    ];
    if (message.messageType && listSkipNotify.includes(message.messageType)) {
      return;
    }
    const deviceTokens = (
      await this.deviceInfoRepository.find({
        where: {
          userId: {
            inq: userIds,
          },
        },
      })
    )
      .map(function (item) {
        return {
          deviceToken: item.deviceToken || '',
          language: item.language || LANGUAGES.EN,
        };
      })
      .filter((item) => item);
    deviceTokens.forEach(async (item) => {
      const title = [
        ConversationTypesConstant.PAIR.toString(),
        ConversationTypesConstant.GROUP.toString(),
        ConversationTypesConstant.SYSTEM.toString(),
      ].includes(path(conversation, ['conversationType'], ''))
        ? await this.handleGenerateNotifyTitle(conversation, message, user, item.language)
        : {};
      this.firebaseService.message
        .sendToDevice(
          item.deviceToken,
          {
            data: {
              notificationType: String(NOTIFICATION_TYPE_MESSAGE),
              userId: String(message.userId),
              messageId: String(message.id),
              message: String(message.message),
              ...(message.messageType === MessageConstants.systemMessage
                ? {messageType: String(message.messageType)}
                : {}),
              conversationId: String(conversation.id),
              conversationKey: String(conversation.conversationKey),
              conversationName: String(
                conversation.conversationType === ConversationTypesConstant.PAIR
                  ? user.name
                  : `${conversation.conversationName}`,
              ),
              ...(message.messageType !== MessageConstants.systemMessage ? {picture: image} : {}),
            },
            notification: {
              ...title,
              body: `${
                [
                  MessageConstants.attachFileMessage.toString(),
                  MessageConstants.sharePostMessage.toString(),
                  MessageConstants.addUserToConversationMessage.toString(),
                  MessageConstants.renameConversationMessage.toString(),
                  MessageConstants.systemMessage.toString(),
                ].includes(path(message, ['messageType'], ''))
                  ? this.handleGenerateNotifyBody(message, user, item.language)
                  : message.message
              } `,
              sound: 'bingbong.aiff',
              imageUrl: image,
              image: image,
            },
          },
          {
            contentAvailable: true,
            mutableContent: true,
          },
        )
        .then(() => {})
        .catch(() => {});
    });
  }

  async handleGenerateNotifyTitle(
    conversation: Conversation,
    message: Message,
    user: Users,
    language: string,
  ): Promise<object> {
    const {conversationType} = conversation;
    const {messageType} = message;
    if (conversationType === ConversationTypesConstant.PAIR) {
      if (
        messageType === MessageConstants.addUserToConversationMessage ||
        messageType === MessageConstants.renameConversationMessage
      ) {
        return {};
      }
      return {title: `${user.name}`};
    }
    if (conversationType === ConversationTypesConstant.GROUP) {
      const participants = await this.getListContributorInfo(
        conversation?.participants?.map((contributor) => contributor.userId),
      );
      const listParticipantJoin = participants.filter((el) => el.id !== user.id);
      const _conversationName = conversation?.conversationName
        ? conversation.conversationName
        : listParticipantJoin.length > 0
        ? listParticipantJoin.map((user: AnyObject) => user.name).join(', ')
        : participants[0].name;
      if (
        messageType === MessageConstants.addUserToConversationMessage ||
        messageType === MessageConstants.renameConversationMessage
      ) {
        return {};
      }
      return language === LANGUAGES.VI
        ? {title: `${user.name} trong ${_conversationName}`}
        : {title: `${user.name} in ${_conversationName}`};
    }
    if (conversationType === ConversationTypesConstant.SYSTEM) {
      return {title: `jGooooo`};
    } else {
      return {};
    }
  }

  handleGenerateNotifyBody(message: Message, user: Users, language: string): string {
    const {messageType, attachments} = message;
    if (messageType === MessageConstants.attachFileMessage) {
      return language === LANGUAGES.VI
        ? `Đã gửi ${attachments?.length} đính kèm ${(attachments?.length || 0) > 1 ? 'files' : 'file'}`
        : `Had sent ${attachments?.length} attach ${(attachments?.length || 0) > 1 ? 'files' : 'file'}`;
    }
    if (messageType === MessageConstants.sharePostMessage) {
      return language === LANGUAGES.VI ? `Đã gửi một bài đăng` : `Had sent a post`;
    }
    if (messageType === MessageConstants.addUserToConversationMessage) {
      return language === LANGUAGES.VI
        ? `Bạn vừa thêm ${user.name} vào cuộc hội thoại`
        : `You have been added ${user.name} to a conversation`;
    }
    if (messageType === MessageConstants.renameConversationMessage) {
      return language === LANGUAGES.VI
        ? `${user.name} đã đặt tên nhóm ${message.otherInfo?.conversationName}.`
        : `${user.name} named the group ${message.otherInfo?.conversationName}.`;
    }
    if (messageType === MessageConstants.systemMessage) {
      return language === LANGUAGES.VI ? `Bạn nhận một tin nhắn từ jGooooo.` : `You receive a message from jGooooo.`;
    } else {
      return '';
    }
  }

  async sendNotificationForPage(userId: number, conversationId: string): Promise<void> {
    await this.notificationLogicController.createNotification({
      listUserReceive: [userId],
      conversationId,
      notificationType: NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE,
    });
  }
}
