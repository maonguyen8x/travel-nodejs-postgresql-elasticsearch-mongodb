import {Filter} from '@loopback/repository';
import {param, get, getModelSchemaRef} from '@loopback/rest';
import {Amenity, AmenityCategory, AmenityNameObject} from '../../models';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {AmenitiesHandler} from './amenities.handler';

export class AmenitiesController {
  constructor(
    @inject(HandlerBindingKeys.AMENITIES_HANDLER)
    public amenitiesHandler: AmenitiesHandler,
  ) {}

  @get('/amenity-categories', {
    responses: {
      '200': {
        description: 'Array of AmenityCategory model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'AmenityCategories',
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(AmenityCategory, {
                        title: 'AmenityCategories',
                      }).definitions['AmenityCategories'].properties,
                      name: getModelSchemaRef(AmenityNameObject),
                      amenities: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Amenity, {title: 'Amenities'}).definitions['Amenities'].properties,
                            name: getModelSchemaRef(AmenityNameObject),
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
  async find(
    @param.filter(AmenityCategory, {name: 'filterAminityCategories'})
    filter?: Filter<AmenityCategory>,
  ): Promise<{
    count: number;
    data: AmenityCategory[];
  }> {
    return this.amenitiesHandler.find({filter});
  }
}
