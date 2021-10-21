import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, HttpErrors, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {POST_ACCESS_TYPE_PRIVATE} from '../configs/post-constants';
import {ChildComment, Comments} from '../models';
import {ChildCommentRepository, CommentsRepository, PostsRepository, UsersRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {PostLogicController} from './posts/post-logic.controller';
import {userInfoQuery, userInfoSchema} from './specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {ErrorCode} from '../constants/error.constant';

export class CommentsController {
  constructor(
    @repository(CommentsRepository)
    public commentsRepository: CommentsRepository,
    @repository(ChildCommentRepository)
    public childCommentRepository: ChildCommentRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/comments', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Comments model instance',
        content: {'application/json': {schema: getModelSchemaRef(Comments)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'NewComments',
            type: 'object',
            properties: {
              postId: {
                type: 'number',
              },
              content: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    comments: {postId: number; content: string},
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<Comments> {
    const userId = parseInt(userProfile[securityId]);
    const targetPost = await this.postsRepository.findById(comments.postId);
    if (!targetPost || (targetPost.accessType === POST_ACCESS_TYPE_PRIVATE && userId !== targetPost.creatorId)) {
      throw new HttpErrors.NotAcceptable(ErrorCode.POST_IS_NOT_AVAILABLE);
    }
    const result = await this.commentsRepository.create({
      ...comments,
      userId: parseInt(userProfile[securityId]),
    });
    await this.postLogicController.handleChangeCountTotalComment(result.postId, userId, result.id);
    return result;
  }

  @get('/comments/count', {
    responses: {
      '200': {
        description: 'Comments model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Comments) where?: Where<Comments>): Promise<Count> {
    return this.commentsRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/comments', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Comments model instances',
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
                  items: custormCommentSchema(),
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
    @param.filter(Comments, {name: 'filterComments'}) filter?: Filter<Comments>,
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const listComment = await this.commentsRepository.find({
      ...custormCommentQuery(parseInt(userProfile[securityId])),
      ...filter,
    });
    const count = await this.commentsRepository.count(filter?.where);
    return {
      count: count.count,
      data: Array.from(listComment, (item: any) => {
        const a = {
          ...item,
          user: this.usersRepository.convertDataUser(item.user),
          liked: false,
          childComments: [],
        };
        if (item.childComments && item.childComments.length) {
          // eslint-disable-next-line no-shadow
          a.childComments = item.childComments.slice(0, 3).map((item: any) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const child = {
              ...item,
              user: this.usersRepository.convertDataUser(item.user),
              liked: false,
            };
            if (child.likes && child.likes.length) {
              child.liked = true;
            }
            delete child.likes;
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            return child;
          });
        }
        if (item.likes && item.likes.length) {
          a.liked = true;
        }
        delete a.likes;
        return a;
      }),
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/comments/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Comments PUT success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Comments).definitions.Comments.properties,
                user: userInfoSchema(),
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdateComment',
            properties: {
              content: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    comments: Comments,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<Comments> {
    const targetComment = await this.commentsRepository.findById(id);
    if (targetComment.userId === parseInt(userProfile[securityId])) {
      await this.commentsRepository.updateById(id, {
        ...comments,
      });
      const result = await this.commentsRepository.findById(id, {
        include: [
          {
            relation: 'user',
            scope: {
              ...userInfoQuery(true, parseInt(userProfile[securityId])),
            },
          },
        ],
      });
      return {
        ...result,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        user: this.usersRepository.convertDataUser(result.user),
      };
    } else {
      throw new HttpErrors.Unauthorized(ErrorCode.PERMISSION_DENIED);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/comments/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Comments DELETE success',
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
    @param.path.number('id')
    id: number,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(currentUserProfile[securityId]);
    const currentComment = await this.commentsRepository.findById(id, {
      include: [
        {
          relation: 'post',
        },
      ],
    });

    if (
      currentComment.userId !== userId &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      currentComment?.post?.creatorId !== userId
    ) {
      throw new HttpErrors.Unauthorized(ErrorCode.PERMISSION_DENIED);
    }
    await this.commentsRepository.deleteAll({
      userId: parseInt(currentUserProfile[securityId]),
      id: id,
    });
    await this.postLogicController.handleChangeCountTotalComment(currentComment.postId);

    return {
      message: 'Delete comment success',
    };
  }

  //Child comment

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/comments/{id}/reply', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Child Comments model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(ChildComment)},
        },
      },
    },
  })
  async createReply(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'NewChildComment',
            properties: {
              content: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    childComment: {content: string},
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id')
    id: number,
  ): Promise<ChildComment> {
    const userId = parseInt(userProfile[securityId]);
    const result = await this.commentsRepository.childComments(id).create({
      content: childComment.content,
      userId: parseInt(userProfile[securityId]),
    });
    await this.updateChildCommentCount(id, userId, result.id);
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/child-comments/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Update Child Comment model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(ChildComment)},
        },
      },
    },
  })
  async updateReply(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'UpdateComment',
            type: 'object',
            properties: {
              content: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    childComment: {content: ''},
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id')
    id: number,
  ): Promise<ChildComment> {
    const target = await this.childCommentRepository.findById(id);
    if (target && target.userId === parseInt(userProfile[securityId])) {
      await this.childCommentRepository.updateById(id, {
        content: childComment.content,
      });
    }
    return this.childCommentRepository.findById(id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/child-comment/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Child comment DELETE success',
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
  async deleteChildCommentById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    const target = await this.childCommentRepository.findById(id, {
      include: [
        {
          relation: 'comment',
          scope: {
            include: [
              {
                relation: 'post',
              },
            ],
          },
        },
      ],
    });
    if (
      target.userId !== userId &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      target.comment?.userId !== userId &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      target.comment?.post?.creatorId !== userId
    ) {
      throw new HttpErrors.Unauthorized(ErrorCode.PERMISSION_DENIED);
    }
    await this.childCommentRepository.deleteById(id);
    await this.updateChildCommentCount(target.commentId);
    return {
      message: 'Delete successful',
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/comments/{id}/reply', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of ChildComment model instances',
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
                  items: childCommentInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async getChildComments(
    @param.path.number('id')
    id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(ChildComment, {name: 'filterChildComments'})
    filter?: Filter<ChildComment>,
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const listChildComment = await this.commentsRepository.childComments(id).find({
      ...childCommentInfoQuery(parseInt(userProfile[securityId])),
      ...filter,
    });
    const count = await this.childCommentRepository.count({
      ...filter?.where,
      commentId: id,
    });
    return {
      count: count.count,
      data: Array.from(listChildComment, (item) => {
        const a = {
          ...item,
          liked: false,
        };
        if (item.likes && item.likes.length) {
          a.liked = true;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        delete a.likes;
        return a;
      }),
    };
  }

  async updateChildCommentCount(commentId: number, userId?: number, childCommentId?: number) {
    const targetComment = await this.commentsRepository.findById(commentId);
    const count = await this.childCommentRepository.count({
      commentId: commentId,
    });
    await this.commentsRepository.updateById(commentId, {
      totalReply: count.count,
    });
    if (userId) {
      if (childCommentId) {
        await this.postLogicController.handleChangeCountTotalComment(
          targetComment.postId,
          userId,
          commentId,
          childCommentId,
        );
      } else {
        await this.postLogicController.handleChangeCountTotalComment(targetComment.postId, userId, commentId);
      }
    }
  }
}

export function commentInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Comments).definitions.Comments.properties,
      user: userInfoSchema(),
      liked: {
        type: 'boolean',
      },
      totalReply: {
        type: 'number',
      },
    },
  };
}

export function childCommentInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(ChildComment).definitions.ChildComment.properties,
      user: userInfoSchema(),
      liked: {
        type: 'boolean',
      },
    },
  };
}

export function commentInfoQuery(userId: number) {
  return {
    order: ['id ASC'],
    include: [
      {
        relation: 'user',
        scope: {
          ...userInfoQuery(true, userId),
        },
      },
      {
        relation: 'likes',
        scope: {
          where: {
            userId: userId,
          },
        },
      },
      {
        relation: 'childComments',
        scope: {
          include: [
            {
              relation: 'user',
              scope: {
                ...userInfoQuery(true, userId),
              },
            },
          ],
        },
      },
    ],
  };
}

export function childCommentInfoQuery(userId: number) {
  return {
    order: ['id ASC'],
    include: [
      {
        relation: 'user',
        scope: {
          ...userInfoQuery(true, userId),
        },
      },
      {
        relation: 'likes',
        scope: {
          where: {
            userId: userId,
          },
        },
      },
    ],
  };
}

export function custormCommentSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Comments).definitions.Comments.properties,
      user: userInfoSchema(),
      liked: {
        type: 'boolean',
      },
      totalReply: {
        type: 'number',
      },
      childComments: {
        type: 'array',
        items: childCommentInfoSchema(),
      },
    },
  };
}

export function custormCommentQuery(userId: number): Filter<Comments> {
  return {
    order: ['id ASC'],
    include: [
      {
        relation: 'user',
        scope: {
          ...userInfoQuery(true, userId),
        },
      },
      {
        relation: 'likes',
        scope: {
          where: {
            userId: userId,
          },
        },
      },
      {
        relation: 'childComments',
        scope: {
          order: ['id DESC'],
          include: [
            {
              relation: 'user',
              scope: {
                ...userInfoQuery(true, userId),
              },
            },
            {
              relation: 'likes',
              scope: {
                where: {
                  userId: userId,
                },
              },
            },
          ],
        },
      },
    ],
  };
}
