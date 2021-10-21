import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, del, requestBody} from '@loopback/rest';
import {AUTHORIZE_CUSTOMER} from '../constants/authorize.constant';
import {StaySpecialDayPrice, StaySpecialDayPriceWithRelations} from '../models';
import {StaySpecialDayPriceRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';

export class StaySpecialDayPriceController {
  constructor(
    @repository(StaySpecialDayPriceRepository)
    public staySpecialDayPriceRepository: StaySpecialDayPriceRepository,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/stay-special-day-prices', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'StaySpecialDayPrice model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(StaySpecialDayPrice)},
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(StaySpecialDayPrice, {
            title: 'NewStaySpecialDayPrice',
            exclude: ['id'],
          }),
        },
      },
    })
    staySpecialDayPrice: Omit<StaySpecialDayPrice, 'id'>,
  ): Promise<StaySpecialDayPrice> {
    return this.staySpecialDayPriceRepository.create(staySpecialDayPrice);
  }

  // @get('/stay-special-day-prices/count', {
  //   responses: {
  //     '200': {
  //       description: 'StaySpecialDayPrice model count',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async count(
  //   @param.where(StaySpecialDayPrice) where?: Where<StaySpecialDayPrice>,
  // ): Promise<Count> {
  //   return this.staySpecialDayPriceRepository.count(where);
  // }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/stay-special-day-prices', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of StaySpecialDayPrice model instances',
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
                  items: getModelSchemaRef(StaySpecialDayPrice),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(StaySpecialDayPrice, {name: 'filterStaySpecialDayPrice'})
    filter?: Filter<StaySpecialDayPrice>,
  ): Promise<{data: StaySpecialDayPriceWithRelations[]; count: number}> {
    const [{count}, data] = await Promise.all([
      this.staySpecialDayPriceRepository.count(filter?.where),
      this.staySpecialDayPriceRepository.find(filter),
    ]);

    return {count, data};
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/stay-special-day-prices/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'StaySpecialDayPrice model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(StaySpecialDayPrice),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(StaySpecialDayPrice, {exclude: 'where'})
    filter?: FilterExcludingWhere<StaySpecialDayPrice>,
  ): Promise<StaySpecialDayPrice> {
    return this.staySpecialDayPriceRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/stay-special-day-prices/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'StaySpecialDayPrice PATCH success',
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
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(StaySpecialDayPrice, {
            title: 'UpdateStaySpecialDayPrice',
            exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'serviceId'],
          }),
        },
      },
    })
    staySpecialDayPrice: StaySpecialDayPrice,
  ): Promise<void> {
    await this.staySpecialDayPriceRepository.updateById(id, staySpecialDayPrice);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @del('/stay-special-day-prices/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'StaySpecialDayPrice DELETE success',
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
  async deleteById(@param.path.number('id') id: number): Promise<{success: boolean}> {
    await this.staySpecialDayPriceRepository.deleteById(id);
    return {
      success: true,
    };
  }
}
