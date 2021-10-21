import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {get, getModelSchemaRef, HttpErrors, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {
  NOTIFICATION_TYPE_USER_LIKE_COMMENT,
  NOTIFICATION_TYPE_USER_LIKE_POST,
  NOTIFICATION_TYPE_USER_LIKE_RANKING,
  NOTIFICATION_TYPE_USER_LIKE_REPLY_COMMENT,
} from '../configs/notification-constants';
import {Comments, Likes} from '../models';
import {
  ChildCommentRepository,
  CommentsRepository,
  LikesRepository,
  PostsRepository,
  RankingsRepository,
  ReplyRankingRepository,
  UsersRepository,
} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {userInfoQueryWithFlagFollow} from './follows/follow.controller';
import {NotificationLogicController} from './notification/notification-logic.controller';
import {userInfoQuery, userInfoSchema} from './specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {ErrorCode} from '../constants/error.constant';

export class LikesController {
  constructor(
    @repository(LikesRepository)
    public likesRepository: LikesRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(CommentsRepository)
    public commentsRepository: CommentsRepository,
    @repository(ChildCommentRepository)
    public childCommentRepository: ChildCommentRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(ReplyRankingRepository)
    public replyRankingRepository: ReplyRankingRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/likes/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Likes) where?: Where<Likes>): Promise<Count> {
    return this.likesRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/likes/{typeLikes}/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'List user liked',
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
                  items: likesInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async listPostLikes(
    @inject(SecurityBindings.USER) currentProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.path.string('typeLikes', {
      schema: {
        title: 'typeLikes',
        type: 'string',
        enum: ['post', 'comment', 'child-comment', 'ranking', 'reply-ranking'],
      },
    })
    type: string,
    @param.filter(Comments, {name: 'filterLikes'}) filter?: Filter<Likes>,
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    let likes: AnyObject[];
    let count: Count;
    const userId = parseInt(currentProfile[securityId]);
    if (type === 'post') {
      likes = await this.postsRepository.likes(id).find({
        ...likesInfoQuery(userId),
        ...filter,
      });
      count = await this.likesRepository.count({
        ...filter?.where,
        postId: id,
      });
    } else if (type === 'comment') {
      likes = await this.commentsRepository.likes(id).find({
        ...likesInfoQuery(userId),
        ...filter,
      });
      count = await this.likesRepository.count({
        ...filter?.where,
        commentId: id,
      });
    } else if (type === 'child-comment') {
      likes = await this.childCommentRepository.likes(id).find({
        ...likesInfoQuery(userId),
        ...filter,
      });
      count = await this.likesRepository.count({
        ...filter?.where,
        childCommentId: id,
      });
    } else if (type === 'ranking') {
      likes = await this.rankingsRepository.likes(id).find({
        ...likesInfoQuery(userId),
        ...filter,
      });
      count = await this.likesRepository.count({
        ...filter?.where,
        rankingId: id,
      });
    } else if (type === 'reply-ranking') {
      likes = await this.replyRankingRepository.likes(id).find({
        ...likesInfoQuery(userId),
        ...filter,
      });
      count = await this.likesRepository.count({
        ...filter?.where,
        replyRankingId: id,
      });
    } else {
      throw new HttpErrors.BadRequest(ErrorCode.INVALID_TYPE_LIKE);
    }
    const result: AnyObject[] = Array.from(likes, (item) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const user: AnyObject = {
        ...this.usersRepository.convertDataUser(item.user),
        followed: false,
        followStatus: '',
      };
      if (user.following && user.following.length) {
        user.followed = true;
        user.followStatus = user.following[0].followStatus;
        delete user.following;
      }
      return {
        ...user,
      };
    });
    return {
      count: count.count,
      data: result,
    };
  }

  //post

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/post/{id}/like', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes post',
        content: {'application/json': {schema: getModelSchemaRef(Likes)}},
      },
    },
  })
  async likePost(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Likes> {
    const userId = parseInt(currentUserProfile[securityId]);
    const currentLike = await this.postsRepository.likes(id).find({where: {userId: userId}});
    if (currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.postsRepository.likes(id).create({userId: userId});
    const totalLike = await this.likesRepository.count({postId: id});
    await this.postsRepository.updateById(id, {totalLike: totalLike.count});

    const targetPost = await this.postsRepository.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [targetPost.creatorId],
      notificationType: NOTIFICATION_TYPE_USER_LIKE_POST,
      eventCreatorId: userId,
      targetPost: targetPost.id,
    });
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/post/{id}/unlike', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Likes DELETE post success',
        content: {
          'application/json': {
            schema: CountSchema,
          },
        },
      },
    },
  })
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Count> {
    const currentLike = await this.postsRepository.likes(id).find({
      where: {
        userId: parseInt(userProfile[securityId]),
      },
    });
    if (!currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.postsRepository.likes(id).delete({userId: parseInt(userProfile[securityId])});
    const totalLike = await this.likesRepository.count({
      postId: id,
    });
    await this.postsRepository.updateById(id, {totalLike: totalLike.count});
    return result;
  }

  //Comment

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/comment/{id}/like', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes comment by id',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Likes),
          },
        },
      },
    },
  })
  async likeComment(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Likes> {
    const userId = parseInt(currentUserProfile[securityId]);
    const currentLike = await this.commentsRepository.likes(id).find({
      where: {
        userId: parseInt(currentUserProfile[securityId]),
      },
    });
    if (currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.commentsRepository.likes(id).create({userId: parseInt(currentUserProfile[securityId])});
    const totalLike = await this.likesRepository.count({
      commentId: id,
    });
    await this.commentsRepository.updateById(id, {totalLike: totalLike.count});
    const targetComment = await this.commentsRepository.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [targetComment.userId],
      notificationType: NOTIFICATION_TYPE_USER_LIKE_COMMENT,
      eventCreatorId: userId,
      targetPost: targetComment.postId,
      commentId: targetComment.id,
    });
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/comment/{id}/unlike', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes comment by id',
        content: {
          'application/json': {schema: CountSchema},
        },
      },
    },
  })
  async unlikeComment(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Count> {
    const userId = parseInt(currentUserProfile[securityId]);
    const currentLike = await this.commentsRepository.likes(id).find({
      where: {
        userId: userId,
      },
    });
    if (!currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.commentsRepository.likes(id).delete({userId: userId});
    const totalLike = await this.likesRepository.count({
      commentId: id,
    });
    await this.commentsRepository.updateById(id, {totalLike: totalLike.count});
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/child-comment/{id}/like', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes child comment by id',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Likes),
          },
        },
      },
    },
  })
  async likeChildComment(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Likes> {
    const userId = parseInt(currentUserProfile[securityId]);

    const currentLike = await this.childCommentRepository.likes(id).find({
      where: {
        userId: parseInt(currentUserProfile[securityId]),
      },
    });
    if (currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.childCommentRepository.likes(id).create({
      userId: parseInt(currentUserProfile[securityId]),
    });
    const totalLike = await this.likesRepository.count({
      childCommentId: id,
    });
    await this.childCommentRepository.updateById(id, {
      totalLike: totalLike.count,
    });

    const targetChildComment = await this.childCommentRepository.findById(id);
    const targetComment = await this.commentsRepository.findById(targetChildComment.commentId);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [targetChildComment.userId],
      notificationType: NOTIFICATION_TYPE_USER_LIKE_REPLY_COMMENT,
      eventCreatorId: userId,
      targetPost: targetComment.postId,
      commentId: targetComment.id,
      childCommentId: targetChildComment.id,
    });

    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/child-comment/{id}/unlike', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'un like child comment by id',
        content: {
          'application/json': {schema: CountSchema},
        },
      },
    },
  })
  async unlikeChildComment(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Count> {
    const currentLike = await this.childCommentRepository.likes(id).find({
      where: {
        userId: parseInt(currentUserProfile[securityId]),
      },
    });
    if (!currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.childCommentRepository
      .likes(id)
      .delete({userId: parseInt(currentUserProfile[securityId])});
    const totalLike = await this.likesRepository.count({
      childCommentId: id,
    });
    await this.childCommentRepository.updateById(id, {
      totalLike: totalLike.count,
    });
    return result;
  }

  // ranking

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/ranking/{id}/like', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Likes ranking by id',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Likes),
          },
        },
      },
    },
  })
  async likeRanking(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Likes> {
    const userId = parseInt(currentUserProfile[securityId]);

    const currentLike = await this.rankingsRepository.likes(id).find({
      where: {
        userId: parseInt(currentUserProfile[securityId]),
      },
    });
    if (currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.rankingsRepository.likes(id).create({
      userId: parseInt(currentUserProfile[securityId]),
    });
    const totalLike = await this.likesRepository.count({
      rankingId: id,
    });
    await this.rankingsRepository.updateById(id, {totalLike: totalLike.count});

    const targetRanking = await this.rankingsRepository.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [targetRanking.userId],
      notificationType: NOTIFICATION_TYPE_USER_LIKE_RANKING,
      eventCreatorId: userId,
      targetPost: targetRanking.postId,
      rankingId: targetRanking.id,
    });

    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/raking/{id}/unlike', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'un Like raking by id',
        content: {
          'application/json': {schema: CountSchema},
        },
      },
    },
  })
  async unlikeRanking(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Count> {
    const currentLike = await this.rankingsRepository.likes(id).find({
      where: {
        userId: parseInt(currentUserProfile[securityId]),
      },
    });
    if (!currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.rankingsRepository.likes(id).delete({userId: parseInt(currentUserProfile[securityId])});
    const totalLike = await this.likesRepository.count({
      rankingId: id,
    });
    await this.rankingsRepository.updateById(id, {totalLike: totalLike.count});
    return result;
  }

  // reply ranking

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/reply-ranking/{id}/like', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'ReplyLikes ranking by id',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Likes),
          },
        },
      },
    },
  })
  async likeReplyRanking(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Likes> {
    const userId = parseInt(currentUserProfile[securityId]);
    const currentLike = await this.replyRankingRepository.likes(id).find({
      where: {
        userId: userId,
      },
    });
    if (currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.replyRankingRepository.likes(id).create({
      userId: userId,
    });
    const totalLike = await this.likesRepository.count({
      replyRankingId: id,
    });
    await this.replyRankingRepository.updateById(id, {
      totalLike: totalLike.count,
    });
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/reply-raking/{id}/unlike', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'un Like replyraking by id',
        content: {
          'application/json': {schema: CountSchema},
        },
      },
    },
  })
  async unlikeReplyRanking(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Count> {
    const userId = parseInt(currentUserProfile[securityId]);
    const currentLike = await this.replyRankingRepository.likes(id).find({
      where: {
        userId: userId,
      },
    });
    if (!currentLike.length) {
      throw new HttpErrors.BadRequest(ErrorCode.DUPLICATE_LIKE);
    }
    const result = await this.replyRankingRepository.likes(id).delete({userId: userId});
    const totalLike = await this.likesRepository.count({
      replyRankingId: id,
    });
    await this.replyRankingRepository.updateById(id, {
      totalLike: totalLike.count,
    });
    return result;
  }
}

export function likesInfoSchema() {
  return {
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
  };
}

export function likesInfoQuery(userId: number) {
  return {
    include: [
      {
        relation: 'user',
        scope: {
          include: [...userInfoQuery(true, userId).include, ...userInfoQueryWithFlagFollow(true, userId).include],
        },
      },
    ],
  };
}
