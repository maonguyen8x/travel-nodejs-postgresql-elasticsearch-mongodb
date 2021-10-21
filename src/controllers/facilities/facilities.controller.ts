import {Filter} from '@loopback/repository';
import {param, get, getModelSchemaRef} from '@loopback/rest';
import {Facility, FacilityCategory, FacilityNameObject} from '../../models';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {FacilitiesHandler} from './facilities.handler';

export class FacilitiesController {
  constructor(
    @inject(HandlerBindingKeys.FACILITIES_HANDLER)
    public facilitiesHandler: FacilitiesHandler,
  ) {}

  @get('/facility-categories', {
    responses: {
      '200': {
        description: 'Array of FacilityCategory model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'FacilityCategories',
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(FacilityCategory, {
                        title: 'FacilityCategories',
                        exclude: ['name'],
                      }).definitions['FacilityCategories'].properties,
                      name: getModelSchemaRef(FacilityNameObject),
                      facilities: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Facility, {
                              exclude: ['name'],
                              title: 'Facilites',
                            }).definitions['Facilites'].properties,
                            name: getModelSchemaRef(FacilityNameObject),
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
    @param.filter(FacilityCategory, {name: 'filterFacilities'})
    filter?: Filter<FacilityCategory>,
  ): Promise<{
    count: number;
    data: FacilityCategory[];
  }> {
    return this.facilitiesHandler.find({filter});
  }
}
