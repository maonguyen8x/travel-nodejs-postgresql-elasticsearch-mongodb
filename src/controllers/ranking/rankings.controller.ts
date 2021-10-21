import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {get, getModelSchemaRef, HttpErrors, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {rankingTypes} from '../../configs-type';
import {RANKING_ACCESS_TYPE_ACCEPTED} from '../../configs/ranking-constant';
import {Rankings} from '../../models';
import {LocationsRepository, PostsRepository, RankingsRepository} from '../../repositories';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {replyRankingInfoQuery, replyRankingInfoSchema} from './reply-ranking.controller';
import {userInfoQuery, userInfoSchema} from '../specs/user-controller.specs';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {handleError} from '../../utils/handleError';
import {RankingLogicController} from './ranking-logic.controller';

export class RankingsController {
  constructor(
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(LocationsRepository)
    protected locationsRepository: LocationsRepository,
    @repository(PostsRepository)
    protected postsRepository: PostsRepository,
    @inject('controllers.RankingLogicController')
    public rankingLogicController: RankingLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/rankings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Rankings model instance',
        content: {'application/json': {schema: getModelSchemaRef(Rankings)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'NewRankings',
            properties: {
              point: {
                type: 'number',
              },
              review: {
                type: 'string',
              },
              postId: {
                type: 'number',
              },
              locationId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    rankings: Omit<Rankings, 'id'>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Rankings> {
    const userId = parseInt(currentUserProfile[securityId]);
    const newRanking = {
      ...rankings,
      userId: userId,
    };
    return this.rankingLogicController.create(newRanking);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/rankings/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Rankings model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Rankings) where?: Where<Rankings>): Promise<Count> {
    return this.rankingsRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/rankings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Rankings model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: rankingInfoSchema(),
                },
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
  async find(
    @inject(SecurityBindings.USER)
    currentProfile: UserProfile,
    @param.filter(Rankings, {name: 'filterRankings'}) filter?: Filter<Rankings>,
  ): Promise<{count: number; data: AnyObject[]}> {
    const ctrFilter = {
      ...rankingInfoQuery(parseInt(currentProfile[securityId])),
      ...filter,
      where: {
        rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
        ...filter?.where,
      },
    };
    const result = await this.rankingsRepository.find(ctrFilter);
    const count = await this.rankingsRepository.count(ctrFilter.where);
    return {
      count: count.count,
      data: result.map((item) => {
        const data = {
          ...item,
          liked: false,
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        delete data.likes;
        if (item.likes && item.likes.length) {
          data.liked = true;
        }
        if (item.replyRankings && item.replyRankings.length) {
          const reply = {
            ...item.replyRankings[0],
            liked: false,
          };
          if (reply.likes && reply.likes.length) {
            reply.liked = true;
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            delete reply.likes;
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          data.replyRankings = [reply];
        }
        return data;
      }),
    };
  }

  @get('/rankings/types', {
    responses: {
      '200': {
        description: 'Array of Service type',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  key: {
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
  async getRankingTypes(): Promise<{id: number; key: string}[]> {
    return Array.from(rankingTypes(), (item: string, key: number) => {
      return {
        id: key,
        key: item,
      };
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/ranking/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Rankings model instances',
        content: {
          'application/json': {
            schema: rankingInfoSchema(),
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER)
    currentProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Rankings, {exclude: 'where', name: 'filterComment'})
    filter?: FilterExcludingWhere<Rankings>,
  ): Promise<AnyObject> {
    const userId = parseInt(currentProfile[securityId]);
    const result = await this.rankingsRepository.findById(id, {
      ...rankingInfoQuery(userId),
      ...filter,
    });
    if (!result) {
      throw new HttpErrors.NotAcceptable('This ranking is not available');
    }
    const data = {
      ...result,
      liked: false,
    };
    if (data.likes && data.likes.length) {
      data.liked = true;
    }
    return data;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/rankings/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Rankings PATCH success',
        content: {
          'application/json': {
            schema: rankingInfoSchema(),
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
            title: 'UpdateRanking',
            properties: {
              review: {
                type: 'string',
              },
              point: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    rankings: Rankings,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Rankings> {
    const userId = parseInt(currentUserProfile[securityId]);
    try {
      await this.rankingLogicController.updateRankingById(id, userId, rankings);
      // eslint-disable-next-line no-return-await
      return await this.rankingsRepository.findById(id, {
        ...rankingInfoQuery(parseInt(currentUserProfile[securityId])),
      });
    } catch (e) {
      return handleError(e);
    }
  }
}

export function rankingInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Rankings).definitions.Rankings.properties,
      user: userInfoSchema(),
      liked: {
        type: 'boolean',
      },
      replyRankings: {
        type: 'array',
        items: replyRankingInfoSchema(),
      },
    },
  };
}

export function rankingInfoQuery(userId: number) {
  return {
    include: [
      {
        relation: 'user',
        scope: {
          ...userInfoQuery(true, userId),
        },
      },
      {
        relation: 'replyRankings',
        scope: {
          order: ['id DESC'],
          include: [...replyRankingInfoQuery(userId).include],
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
