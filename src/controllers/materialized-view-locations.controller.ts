import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, put, del, requestBody} from '@loopback/rest';
import {MaterializedViewLocations} from '../models';
import {MaterializedViewLocationsRepository} from '../repositories';

export class MaterializedViewLocationsController {
  constructor(
    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
  ) {}

  @post('/materialized-view-locations', {
    responses: {
      '200': {
        description: 'MaterializedViewLocations model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MaterializedViewLocations),
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MaterializedViewLocations, {
            title: 'NewMaterializedViewLocations',
            exclude: ['id'],
          }),
        },
      },
    })
    materializedViewLocations: Omit<MaterializedViewLocations, 'id'>,
  ): Promise<MaterializedViewLocations> {
    return this.materializedViewLocationsRepository.create(materializedViewLocations);
  }

  @get('/materialized-view-locations/count', {
    responses: {
      '200': {
        description: 'MaterializedViewLocations model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(MaterializedViewLocations)
    where?: Where<MaterializedViewLocations>,
  ): Promise<Count> {
    return this.materializedViewLocationsRepository.count(where);
  }

  @get('/materialized-view-locations', {
    responses: {
      '200': {
        description: 'Array of MaterializedViewLocations model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(MaterializedViewLocations),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(MaterializedViewLocations)
    filter?: Filter<MaterializedViewLocations>,
  ): Promise<MaterializedViewLocations[]> {
    await this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
    return this.materializedViewLocationsRepository.find(filter);
  }

  @patch('/materialized-view-locations', {
    responses: {
      '200': {
        description: 'MaterializedViewLocations PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MaterializedViewLocations),
        },
      },
    })
    materializedViewLocations: MaterializedViewLocations,
    @param.where(MaterializedViewLocations)
    where?: Where<MaterializedViewLocations>,
  ): Promise<Count> {
    return this.materializedViewLocationsRepository.updateAll(materializedViewLocations, where);
  }

  @get('/materialized-view-locations/{id}', {
    responses: {
      '200': {
        description: 'MaterializedViewLocations model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MaterializedViewLocations),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(MaterializedViewLocations, {exclude: 'where'})
    filter?: FilterExcludingWhere<MaterializedViewLocations>,
  ): Promise<MaterializedViewLocations> {
    return this.materializedViewLocationsRepository.findById(id, filter);
  }

  @patch('/materialized-view-locations/{id}', {
    responses: {
      '204': {
        description: 'MaterializedViewLocations PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MaterializedViewLocations),
        },
      },
    })
    materializedViewLocations: MaterializedViewLocations,
  ): Promise<void> {
    await this.materializedViewLocationsRepository.updateById(id, materializedViewLocations);
  }

  @put('/materialized-view-locations/{id}', {
    responses: {
      '204': {
        description: 'MaterializedViewLocations PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() materializedViewLocations: MaterializedViewLocations,
  ): Promise<void> {
    await this.materializedViewLocationsRepository.replaceById(id, materializedViewLocations);
  }

  @del('/materialized-view-locations/{id}', {
    responses: {
      '204': {
        description: 'MaterializedViewLocations DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.materializedViewLocationsRepository.deleteById(id);
  }
}
