import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, del, requestBody} from '@loopback/rest';
import {AUTHORIZE_CUSTOMER} from '../constants/authorize.constant';
import {AccommodationType} from '../models';
import {AccommodationTypeRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';

export class AccommodationTypeController {
  constructor(
    @repository(AccommodationTypeRepository)
    public accommodationTypeRepository: AccommodationTypeRepository,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/accommodation-types', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'AccommodationType model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(AccommodationType)},
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccommodationType, {
            title: 'NewAccommodationType',
            exclude: ['id', 'createdAt', 'deletedAt', 'updatedAt'],
          }),
        },
      },
    })
    accommodationType: Omit<AccommodationType, 'id'>,
  ): Promise<AccommodationType> {
    return this.accommodationTypeRepository.create(accommodationType);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/accommodation-types/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'AccommodationType model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(AccommodationType) where?: Where<AccommodationType>): Promise<Count> {
    return this.accommodationTypeRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/accommodation-types', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of AccommodationType model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(AccommodationType),
            },
          },
        },
      },
    },
  })
  async find(@param.filter(AccommodationType) filter?: Filter<AccommodationType>): Promise<AccommodationType[]> {
    return this.accommodationTypeRepository.find(filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/accommodation-types/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'AccommodationType model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AccommodationType),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AccommodationType, {exclude: 'where'})
    filter?: FilterExcludingWhere<AccommodationType>,
  ): Promise<AccommodationType> {
    return this.accommodationTypeRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/accommodation-types/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'AccommodationType PATCH success',
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
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccommodationType),
        },
      },
    })
    accommodationType: AccommodationType,
  ): Promise<{
    message: string;
  }> {
    await this.accommodationTypeRepository.updateById(id, accommodationType);
    return {
      message: 'updated accommodation type successful',
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @del('/accommodation-types/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'AccommodationType DELETE success',
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
  ): Promise<{
    message: string;
  }> {
    await this.accommodationTypeRepository.deleteById(id);
    return {
      message: 'deleted accommodation type successful',
    };
  }
}
