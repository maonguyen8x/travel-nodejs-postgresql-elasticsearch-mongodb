import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, HttpErrors, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ReplyRanking} from '../../models';
import {RankingsRepository, ReplyRankingRepository} from '../../repositories';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {userInfoQuery, userInfoSchema} from '../specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {RankingLogicController} from './ranking-logic.controller';
import {ErrorCode} from '../../constants/error.constant';

export class ReplyRankingController {
  constructor(
    @repository(ReplyRankingRepository)
    public replyRankingRepository: ReplyRankingRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @inject('controllers.RankingLogicController')
    public rankingLogicController: RankingLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/ranking/{id}/reply-rankings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'ReplyRanking model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(ReplyRanking)},
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'NewReplyRanking',
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
    replyRanking: {content: string},
    @inject(SecurityBindings.USER)
    currentProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<ReplyRanking> {
    const result = await this.rankingsRepository.replyRankings(id).create({
      userId: parseInt(currentProfile[securityId]),
      content: replyRanking.content,
    });
    await this.updateCountReplyRanking(id);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.rankingLogicController.createNotificationForReplyRanking(result);
    return result;
  }

  @get('/reply-rankings/count', {
    responses: {
      '200': {
        description: 'ReplyRanking model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(ReplyRanking, 'filterWhereReplyRankingCount')
    where?: Where<ReplyRanking>,
  ): Promise<Count> {
    return this.replyRankingRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/ranking/{id}/reply-rankings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of ReplyRanking model instances',
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
                  items: replyRankingInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER)
    currentProfile: UserProfile,
    @param.filter(ReplyRanking, {name: 'filterReplyRanking'})
    filter?: Filter<ReplyRanking>,
  ): Promise<{count: number; data: AnyObject[]}> {
    const userId = parseInt(currentProfile[securityId]);
    const ctrFilter = {
      ...replyRankingInfoQuery(userId),
      ...filter,
    };
    const result = await this.rankingsRepository.replyRankings(id).find({
      ...ctrFilter,
    });
    const count = await this.replyRankingRepository.count({rankingId: id});
    return {
      count: count.count,
      data: result.map((item) => {
        const newItem = {
          ...item,
          liked: false,
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        delete newItem.likes;
        if (item.likes && item.likes.length) {
          newItem.liked = true;
        }
        return newItem;
      }),
    };
  }

  // @get('/reply-rankings/{id}', {
  //   responses: {
  //     '200': {
  //       description: 'ReplyRanking model instance',
  //       content: {
  //         'application/json': {
  //           schema: getModelSchemaRef(ReplyRanking, {includeRelations: true}),
  //         },
  //       },
  //     },
  //   },
  // })
  // async findById(
  //   @param.path.number('id') id: number,
  //   @param.filter(ReplyRanking, {exclude: 'where', name:"filterRankingById"}) filter?: FilterExcludingWhere<ReplyRanking>
  // ): Promise<ReplyRanking> {
  //   return this.replyRankingRepository.findById(id, filter);
  // }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/reply-rankings/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'ReplyRanking PUT success',
        content: {
          'application/json': {
            schema: {
              ...replyRankingInfoSchema(),
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
            title: 'UpdateReplyRanking',
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
    replyRanking: ReplyRanking,
    @inject(SecurityBindings.USER)
    currentProfile: UserProfile,
  ): Promise<AnyObject> {
    const userId = parseInt(currentProfile[securityId]);
    const target = await this.replyRankingRepository.findById(id);
    if (target.userId !== userId) {
      throw new HttpErrors.Unauthorized(ErrorCode.PERMISSION_DENIED);
    }
    await this.replyRankingRepository.updateById(id, replyRanking);
    return this.replyRankingRepository.findById(id, {
      ...replyRankingInfoQuery(userId),
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/reply-rankings/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'ReplyRanking DELETE success',
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
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER)
    currentProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(currentProfile[securityId]);
    const target = await this.replyRankingRepository.findById(id);
    if (target.userId !== userId) {
      throw new HttpErrors.Unauthorized(ErrorCode.PERMISSION_DENIED);
    }
    await this.replyRankingRepository.deleteById(id);
    await this.updateCountReplyRanking(target.rankingId);
    return {
      message: 'Delete Reply Ranking Successful',
    };
  }

  async updateCountReplyRanking(rankingId: number) {
    const count = await this.replyRankingRepository.count({
      rankingId: rankingId,
    });
    await this.rankingsRepository.updateById(rankingId, {
      totalReply: count.count,
    });
  }
}

export function replyRankingInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(ReplyRanking, {title: 'custormReplyRanking'}).definitions.custormReplyRanking.properties,
      user: userInfoSchema(),
      liked: {
        type: 'boolean',
      },
    },
  };
}

export function replyRankingInfoQuery(userId: number) {
  return {
    include: [
      {
        relation: 'user',
        scope: userInfoQuery(true, userId),
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
