import {Filter, repository} from '@loopback/repository';
import {param, get, getModelSchemaRef} from '@loopback/rest';
import {PropertyType} from '../models';
import {PropertyTypeRepository} from '../repositories';

export class PropertyTypeController {
  constructor(
    @repository(PropertyTypeRepository)
    public propertyTypeRepository: PropertyTypeRepository,
  ) {}

  @get('/property-types', {
    responses: {
      '200': {
        description: 'Array of PropertyType model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: getModelSchemaRef(PropertyType),
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
    @param.filter(PropertyType, {name: 'filterPropertyType'})
    filter?: Filter<PropertyType>,
  ): Promise<{
    count: number;
    data: PropertyType[];
  }> {
    const count = await this.propertyTypeRepository.count(filter?.where);
    const data = await this.propertyTypeRepository.find(filter);
    return {
      count: count.count,
      data,
    };
  }
}
