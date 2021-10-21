import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Filter} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Interesting, Locations, MediaContents, Rankings} from '../../models';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {locationTypes} from '../../configs/location-constant';
import {HandleSearchResultInterface} from '../locations/location-interface';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {InterestingHandler} from './interesting.handler';
import {FilterSearchInterestingInterface, interestingSchema} from './interesting.constant';
import {handleError} from '../../utils/handleError';
import {LocationActivityInterface} from '../util/util-interface';

export class InterestingController {
  constructor(
    @inject(HandlerBindingKeys.INTERESTING_HANDLER)
    public interestingHandler: InterestingHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/interestings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Interesting model instance',
        content: {'application/json': {schema: getModelSchemaRef(Interesting)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Interesting, {
            title: 'NewInteresting',
            exclude: ['id', 'createdAt', 'userId'],
          }),
        },
      },
    })
    interesting: Omit<Interesting, 'id'>,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Interesting> {
    const userId = parseInt(userProfile[securityId]);
    return this.interestingHandler.create(interesting, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/interestings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Interesting model instances',
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
                  title: 'interesting',
                  items: interestingSchema(),
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
    userProfile: UserProfile,
    @param.filter(Interesting, {name: 'filterInteresting'})
    filter?: Filter<Interesting>,
  ): Promise<{
    data: AnyObject[];
    count: number;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.interestingHandler.find({userId, filter}).catch((e) => {
      return handleError(e);
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/interestings/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Interesting DELETE success',
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
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.interestingHandler.deleteById(userId, id).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/interestings/search', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Interesting model instances',
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
                      ...getModelSchemaRef(Locations).definitions.Locations.properties,
                      distance: {
                        type: 'number',
                      },
                      pageId: {
                        type: 'number',
                      },
                      serviceId: {
                        type: 'number',
                      },
                      locationId: {
                        type: 'number',
                      },
                      ranking: getModelSchemaRef(Rankings),
                      attachments: {
                        type: 'object',
                        properties: {
                          mediaContents: {
                            type: 'array',
                            items: getModelSchemaRef(MediaContents),
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
      },
    },
  })
  async searchInterests(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param({
      name: 'filterInterestingSearch',
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
              type: {
                type: 'string',
                enum: locationTypes,
              },
              where: {
                title: 'Interesting.WhereFilter',
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    })
    filter: FilterSearchInterestingInterface,
  ): Promise<{
    data: (HandleSearchResultInterface | LocationActivityInterface | null)[];
    count: number;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.interestingHandler.searchInterests(userId, filter).catch((e) => handleError(e));
  }
}
