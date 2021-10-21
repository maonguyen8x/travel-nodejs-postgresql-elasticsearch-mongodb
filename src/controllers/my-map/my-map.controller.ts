import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {MYMAP_ACCESS_TYPE} from '../../configs/mymap-constants';
import {LocationRequests, Locations, MyLocations, Rankings} from '../../models';
import {MediaContents} from '../../models';
import {MyLocationsRepository, UsersRepository} from '../../repositories';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {MyMapLogicController} from './my-map-logic.controller';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {handleError} from '../../utils/handleError';
import {MyMapWithLocationHadAttachmentInterface} from './my-map.constant';

export class MyMapController {
  constructor(
    @repository(MyLocationsRepository)
    public myLocationsRepository: MyLocationsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @inject('controllers.MyMapLogicController')
    public myMapLogicController: MyMapLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/user/my-maps', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Add location to my map',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyLocations),
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(MyLocations, {
            title: 'NewMyLocations',
            exclude: ['id', 'createdAt', 'updatedAt', 'userId'],
          }),
        },
      },
    })
    myLocations: Omit<MyLocations, 'id'>,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<MyLocations> {
    const userId = parseInt(userProfile[securityId]);
    const newLocation = {
      ...myLocations,
      userId: userId,
    };
    return this.myMapLogicController.create(newLocation);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/my-map', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of MyLocations model instances',
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
                  items: myMapsInfoSchema(),
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
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'filterMyMap',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              coordinates: {
                type: 'string',
              },
              offset: {
                type: 'number',
              },
              distance: {
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
              where: {
                title: 'MyLocations.WhereFilter',
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    })
    filter: {
      q: string;
      coordinates: string;
      offset: number;
      limit: number;
      distance: number;
      skip: number;
      where: object;
      order: string[];
    },
    @param.where(Locations, 'locationFilterWhere')
    whereLocation?: Where<Locations>,
  ): Promise<{count: number; data: MyMapWithLocationHadAttachmentInterface[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.myMapLogicController.find({id, userId, filter, whereLocation}).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/user/my-map/{id}/update', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'MyLocations model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(MyLocations),
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
            properties: {
              accessType: {
                type: 'string',
                enum: MYMAP_ACCESS_TYPE,
              },
            },
          },
        },
      },
    })
    myLocations: {accessType: string},
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<MyLocations> {
    const userId = parseInt(userProfile[securityId]);
    const {accessType} = myLocations;
    await this.usersRepository.myLocations(userId).patch(
      {
        accessType,
      },
      {id: id},
    );
    return this.myLocationsRepository.findById(id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/user/my-map/{id}/delete', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'MyMap DELETE success',
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
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.myMapLogicController.deleteById(id, userId).catch((e) => handleError(e));
  }
}

export function myMapsInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(MyLocations).definitions.MyLocations.properties,
      distance: {
        type: 'number',
      },
      ranking: getModelSchemaRef(Rankings),
      location: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          type: {
            type: 'string',
          },
          locationRequest: getModelSchemaRef(LocationRequests),
          pageId: {
            type: 'number',
          },
          serviceId: {
            type: 'number',
          },
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
  };
}

export function myMapsInfoQuery() {
  return {
    include: [
      {
        relation: 'location',
      },
    ],
  };
}
