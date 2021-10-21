import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Filter, FilterExcludingWhere} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Conversation, MediaContents, Message, Users} from '../../models';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {userInfoSchema} from '../specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {MessagesHandlerController} from './messages-handler.controller';
import {followInfoSchema} from '..';
import {ConversationResponseInterface} from './messages.interface';

export const messageInfoSchema = {
  type: 'object',
  properties: {
    ...getModelSchemaRef(Message).definitions.Message.properties,
    user: userInfoSchema(),
    attachments: {
      type: 'array',
      items: getModelSchemaRef(MediaContents),
    },
  },
};

export class MessagesController {
  constructor(
    @inject('controllers.MessagesHandlerController')
    public messagesHandlerController: MessagesHandlerController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/messages', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Message model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                message: {
                  type: 'array',
                  items: messageInfoSchema,
                },
                conversationId: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async getMessages(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'filterMessage',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              userIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
              key: {
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
                  ...getModelSchemaRef(Message).definitions.Message.properties,
                },
              },
            },
          },
        },
      },
    })
    filter?: {
      userIds: number[];
      key: string;
      offset: number;
      limit: number;
      skip: number;
      order: string[];
      where: object;
    },
  ): Promise<{
    count: number;
    message: AnyObject[];
    conversationId: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    const userIds = [...(filter?.userIds || [])];
    const conversationKey = filter?.key;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    delete filter?.userIds;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    delete filter?.key;
    const filterMessage = {
      ...filter,
    };
    return this.messagesHandlerController.getMessages(userId, filterMessage, userIds, conversationKey);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/messages-system', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Message model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                message: {
                  type: 'array',
                  items: messageInfoSchema,
                },
              },
            },
          },
        },
      },
    },
  })
  async getMessagesSystem(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'filterMessage',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              key: {
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
                  ...getModelSchemaRef(Message).definitions.Message.properties,
                },
              },
            },
          },
        },
      },
    })
    filter?: {
      key: string;
      offset: number;
      limit: number;
      skip: number;
      order: string[];
      where: object;
    },
  ): Promise<{
    count: number;
    message: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    const conversationKey = filter?.key;
    const filterMessage = {
      ...filter,
    };
    return this.messagesHandlerController.getMessagesSystem(userId, filterMessage, conversationKey);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/create-conversation', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Create New conversation',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Conversation),
          },
        },
      },
    },
  })
  async createConversation(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'NewConversations',
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
    body: {userIds: number[]},
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<Conversation> {
    const userId = parseInt(userProfile[securityId]);
    const userIdsIncludeUserId = Array.from(new Set([...(body?.userIds || []), userId]));
    return this.messagesHandlerController.createConversation(userId, userIdsIncludeUserId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/create-message', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Create New Messsage',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Message),
          },
        },
      },
    },
  })
  async createMessage(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'NewMessage',
            type: 'object',
            properties: {
              ...getModelSchemaRef(Message, {
                title: 'OptionalCreateMessage',
                exclude: ['id', 'createdAt', 'updatedAt', 'accessRead', 'userId', 'attachments'],
              }).definitions.OptionalCreateMessage.properties,
              attachments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
                  },
                },
              },
            },
            required: ['conversationId', 'messageType'],
          },
        },
      },
    })
    body: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'accessRead' | 'userId'>,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<Message> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.createMessage(userId, body, true);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/conversations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of conversation model instances',
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
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                      blockStatus: {
                        type: 'object',
                        properties: {
                          isBlockedTargetUser: {
                            type: 'boolean',
                          },
                          isTargetUserBlockedMe: {
                            type: 'boolean',
                          },
                        },
                      },
                      countUnRead: {
                        type: 'number',
                      },
                      ...getModelSchemaRef(Conversation).definitions.Conversation.properties,
                      participants: {
                        type: 'array',
                        items: userInfoSchema(),
                      },
                      lastestMessage: getModelSchemaRef(Message),
                      conversationName: {
                        type: 'string',
                      },
                      contributors: {
                        type: 'array',
                        items: userInfoSchema(),
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
  async findConversations(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'searchConversationParams',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              showConversationSystem: {
                type: 'boolean',
              },
            },
          },
        },
      },
    })
    searchConversationParams: {
      q?: string;
      showConversationSystem?: boolean;
    },
    @param.filter(Conversation, {name: 'filterConversation'})
    filter?: Filter<Conversation>,
  ): Promise<{
    data: ConversationResponseInterface[];
    count: number;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.findConversations({
      userId,
      filter,
      q: searchConversationParams?.q,
      showConversationSystem: searchConversationParams?.showConversationSystem,
    });
  }

  // @patch('/messages', {
  //   responses: {
  //     '200': {
  //       description: 'Message PATCH success count',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Message, {partial: true}),
  //       },
  //     },
  //   })
  //   message: Message,
  //   @param.where(Message) where?: Where<Message>,
  // ): Promise<Count> {
  //   return this.messageRepository.updateAll(message, where);
  // }
  //
  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/conversation/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Message model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Conversation).definitions.Conversation.properties,
                contributors: {
                  type: 'array',
                  items: userInfoSchema(),
                },
                participants: {
                  type: 'array',
                  items: {
                    ...userInfoSchema(),
                    properties: {
                      ...userInfoSchema().properties,
                      // page: getModelSchemaRef(Page),
                      // ownerUser: getModelSchemaRef(Users),
                    },
                  },
                },
                conversationName: {
                  type: 'string',
                },
                totalMessages: {
                  type: 'number',
                },
                isNotify: {
                  type: 'boolean',
                },
                blockStatus: {
                  type: 'object',
                  properties: {
                    isBlockedTargetUser: {
                      type: 'boolean',
                    },
                    isTargetUserBlockedMe: {
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
  })
  async findConversationById(
    @param.path.string('id') id: string,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(Conversation, {
      exclude: 'where',
      name: 'filterConversationById',
    })
    filter?: FilterExcludingWhere<Message>,
  ): Promise<AnyObject> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.findConversationById(userId, id, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/conversation/set_conversation_name/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Set conversation name',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Conversation).definitions.Conversation.properties,
              },
            },
          },
        },
      },
    },
  })
  async setConversationName(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'conversationName',
            type: 'object',
            properties: {
              conversationName: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      conversationName: string;
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Conversation> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.setConversationName(id, userId, request);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/conversation/{conversationId}/set_status_notify', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Set conversation name',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
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
  async handleSetNotificationStatus(
    @param.path.string('conversationId') conversationId: string,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.handleSetNotificationStatus(userId, conversationId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/conversation/add_user_to_conversation/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'add user to conversation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Conversation).definitions.Conversation.properties,
              },
            },
          },
        },
      },
    },
  })
  async addUserToConversation(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'addUserConversation',
            type: 'object',
            properties: {
              listUser: {
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
      listUser: number[];
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Conversation> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.addUserToConversation(userId, id, request);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/conversation/{conversationId}/set-admin-conversation', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'add user to conversation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Conversation).definitions.Conversation.properties,
              },
            },
          },
        },
      },
    },
  })
  async setAdminConversation(
    @param.path.string('conversationId') conversationId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'addUserConversation',
            type: 'object',
            properties: {
              adminId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    request: {
      adminId: number;
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Conversation> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.setAdminConversation({
      conversationId,
      userId,
      newAdminId: request.adminId,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/conversation/remove_user_from_conversation/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'remove user to conversation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Conversation).definitions.Conversation.properties,
              },
            },
          },
        },
      },
    },
  })
  async removeUserFromConversation(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'removeUserConversation',
            type: 'object',
            properties: {
              listUser: {
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
      listUser: number[];
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Conversation> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.removeUserFromConversation(userId, id, request);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/messages/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Message DELETE success',
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
  async deleteMessageById(
    @param.path.string('id') id: string,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{
    success: boolean;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.deleteMessageById(userId, id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/conversation/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Conversation DELETE success',
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
  async deleteConversationById(
    @param.path.string('id') id: string,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{
    success: boolean;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.deleteConversationById(userId, id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/conversation/{conversationId}/attachments/{attachType}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of attachments in conversation model instances',
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
                    type: 'object',
                    properties: {
                      ...messageInfoSchema.properties,
                      ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
                      messageId: {
                        type: 'string',
                      },
                    },
                    additionalProperties: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getAttachments(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.string('conversationId') conversationId: string,
    @param.path.string('attachType') attachType: string,
    @param.filter(Message, {name: 'filterMessageAttachment'})
    filter?: Filter<Message>,
  ): Promise<{
    data: AnyObject[];
    count: number;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.getAttachments(userId, conversationId, attachType, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/conversation/user_recently', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Following of user with id',
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
                    ...followInfoSchema(),
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getListUserRecently(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'searchConversationParams',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    searchConversationParams: {
      q?: string;
    },
    @param.filter(Users, {name: 'filterUserRecently'})
    filter: Filter<Users>,
  ): Promise<{count: number; data: Users[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.getListUserRecently({
      userId,
      filter,
      q: searchConversationParams?.q,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/conversation/count_unread', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Following of user with id',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    },
  })
  async getCountUnread(@inject(SecurityBindings.USER) userProfile: UserProfile): Promise<{count: number}> {
    const userId = parseInt(userProfile[securityId]);
    return this.messagesHandlerController.getCountUnread({
      userId,
    });
  }
}
