import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, getWhereSchemaFor, param, post, requestBody, patch} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {
  AccommodationType,
  Activity,
  BusinessHoursObject,
  Currency,
  Interesting,
  LocationRequests,
  Locations,
  MediaContents,
  MyLocations,
  Page,
  Posts,
  PropertyType,
  Rankings,
  Service,
  Stay,
  Tour,
} from '../../models';
import {LocationsRepository, MyLocationsRepository} from '../../repositories';
import {validateLocation} from '../../services/validator';
import {sortByList} from '../../utils/Array';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {LocationsLogicController} from './locations-logic.controller';
import {AUTHORIZE_CUSTOMER, AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {LocationsHandler} from './locations.handler';
import {ILocationChangeRequest, LOCATION_CHANGE_REQUEST_BODY, LocationChangeRequestStatus} from './locations.constant';
import {handleError} from '../../utils/handleError';
import {LocationIsFullEnum, locationTypes, LocationTypesEnum} from '../../configs/location-constant';
import {get as getProperty, has, isEmpty} from 'lodash';
import {
  HandleSearchResultInterface,
  IActivitySearchInput,
  ILocationSearchInput,
  ITourSearchInput,
} from './location-interface';
import {MYMAP_TYPE_HAD_CAME, MYMAP_TYPE_SAVED} from '../../configs/mymap-constants';
import {userInfoSchema} from '../specs/user-controller.specs';
import dayjs from 'dayjs';
import {getDetailLocationWithPlaceIdFormatted, getLocationWithKeywordSearch} from '../../utils/google-api.util';
import {parseStringToGeo} from '../../utils/handleString';

export class LocationsController {
  constructor(
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(MyLocationsRepository)
    public myLocationsRepository: MyLocationsRepository,
    @inject('controllers.LocationsLogicController')
    public locationsLogicController: LocationsLogicController,
    @inject(HandlerBindingKeys.LOCATIONS_HANDLER)
    public locationsHandler: LocationsHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/locations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Locations model instance',
        content: {'application/json': {schema: getModelSchemaRef(Locations)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'NewLocations',
            properties: {
              ...getModelSchemaRef(Locations, {
                title: 'NewLocationsCustom',
                exclude: [
                  'id',
                  'totalReview',
                  'averagePoint',
                  'createdAt',
                  'updatedAt',
                  'deletedAt',
                  'blockedAt',
                  'blockMessage',
                ],
              }).definitions['NewLocationsCustom'].properties,
            },
            required: ['coordinates', 'country', 'areaLevel1', 'areaLevel2', 'areaLevel3'],
          },
        },
      },
    })
    locations: AnyObject,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Locations> {
    validateLocation(locations);
    const userId = parseInt(userProfile[securityId]);
    const newLocation = {
      ...locations,
      userId,
    };
    return this.locationsLogicController.create(newLocation).catch((e) => handleError(e));
  }

  @post('/locations/check_exist', {
    responses: {
      '200': {
        description: 'Locations model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isExist: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async checkExist(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'CheckExistLocation',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    locations: {
      name: string;
    },
  ): Promise<{
    isExist: boolean;
  }> {
    return this.locationsLogicController.checkExist(locations.name).catch((e) => handleError(e));
  }

  // @authenticate('jwt')
  @get('/locations/count', {
    // security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Locations model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Locations) where?: Where<Locations>): Promise<Count> {
    return this.locationsRepository.count(where);
  }

  // @authenticate('jwt')
  @get('/locations', {
    // security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Locations model instances',
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
                  items: newLocationInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Locations, {name: 'filterLocations'})
    filter?: Filter<Locations>,
  ): Promise<{
    count: number;
    data: HandleSearchResultInterface[];
  }> {
    return this.locationsLogicController.find(filter).catch((e) => handleError(e));
  }

  // @authenticate('jwt')
  @get('/locations/location_types', {
    // security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Location type',
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
                  name: {
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
  async getLocationTypes(): Promise<
    {
      id: number;
      name: string;
    }[]
  > {
    return locationTypes.map((item: string, index: number) => {
      return {
        id: index + 1,
        name: item,
      };
    });
  }

  // @authenticate('jwt')
  @get('/locations/{id}', {
    // security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Locations model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Locations),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Locations, {exclude: 'where', name: 'filterLocation'})
    filter?: FilterExcludingWhere<Locations>,
  ): Promise<Locations> {
    return this.locationsRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @get('/locations/elk-search', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Locations model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number',
                      },
                      originalName: {
                        type: 'string',
                      },
                      coordinates: {
                        type: 'object',
                        properties: {
                          lat: {
                            type: 'number',
                          },
                          lon: {
                            type: 'number',
                          },
                        },
                      },
                      originalAddress: {
                        type: 'string',
                      },
                      originalCountry: {
                        type: 'string',
                      },
                      originalAreaLevel1: {
                        type: 'string',
                      },
                    },
                  },
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
  async elkSearch(
    @param({
      name: 'locationELKSearch',
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
              where: getWhereSchemaFor(Locations),
            },
          },
        },
      },
    })
    locationSearch: {
      q: string;
      offset: number;
      limit: number;
      skip: number;
      where: Where<Locations>;
      order: string[];
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{data: Object[]; count: number}> {
    try {
      const userId = parseInt(userProfile[securityId]);
      const {q, ...filter} = {
        ...locationSearch,
        where: locationSearch?.where,
      };
      const searchResult = await this.locationsLogicController.elkSearch(filter, locationSearch?.q);
      if (!isEmpty(searchResult)) {
        const count = getProperty(searchResult, 'body.hits.total.value', 0);
        const hit = getProperty(searchResult, 'body.hits.hits', []);
        const getDataFromHit = (item: {
          _source: {
            id: number;
            originalName: string;
            originalAddress: string;
            originalCountry: string;
            originalAreaLevel1: string;
            coordinates: {
              lat: number;
              lon: number;
            };
          };
        }) => {
          return item._source;
        };
        const listResult = Array.from(hit, getDataFromHit);
        if (listResult.length) {
          return {
            data: listResult,
            count: count,
          };
        } else {
          if (
            !has(filter.where, 'locationType') ||
            getProperty(filter.where, 'locationType') === LocationTypesEnum.google ||
            getProperty(filter.where, 'locationType')?.inq?.includes(LocationTypesEnum.google)
          ) {
            const dataSearch = await getLocationWithKeywordSearch(q);
            const placeIds = dataSearch.map((item: any) => item.place_id);
            for (const iterator of placeIds) {
              const dataSearchDetail = await getDetailLocationWithPlaceIdFormatted(iterator);
              if (!isEmpty(dataSearchDetail)) {
                const newLocation = {
                  name: dataSearchDetail.name,
                  placeId: dataSearchDetail.placeId,
                  locationType: LocationTypesEnum.google.toString(),
                  country: dataSearchDetail.country,
                  areaLevel1: dataSearchDetail.administrativeAreaLevel1,
                  areaLevel2: dataSearchDetail.administrativeAreaLevel2,
                  areaLevel3: dataSearchDetail.administrativeAreaLevel3,
                  areaLevel4: dataSearchDetail.route,
                  areaLevel5: dataSearchDetail.streetNumber,
                  address: dataSearchDetail.formattedAddress,
                  formatedAddress: dataSearchDetail.formattedAddress,
                  coordinates: dataSearchDetail.coordinates,
                  userId: 1,
                };
                const checkLocationExist = await this.locationsRepository.count({
                  placeId: dataSearchDetail.placeId,
                });
                !checkLocationExist.count &&
                  (await this.locationsLogicController.create(newLocation).catch((e) => handleError(e)));
              }
              const query: Filter<Locations> = {
                ...{
                  where: {
                    placeId: {
                      inq: placeIds,
                    },
                  },
                },
              };
              const dataLocationWithGoogleApi = await this.locationsRepository.find(query);
              const dataChangedLocationWithGoogleApi = dataLocationWithGoogleApi.map((data) => {
                return {
                  id: data.id,
                  originalName: data.name,
                  originalAddress: data.address,
                  originalCountry: data.country,
                  originalAreaLevel1: data.areaLevel1,
                  coordinates: parseStringToGeo(data?.coordinates || ''),
                };
              });
              return {
                data: dataChangedLocationWithGoogleApi,
                count: placeIds.length,
              };
            }
          }
        }
      }
      return {
        data: [],
        count: 0,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  @authenticate('jwt')
  @get('/locations/search', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Locations model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: newLocationInfoSchema(),
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
  async search(
    @param({
      name: 'locationSearch',
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
              isFull: {
                type: 'boolean',
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
              where: getWhereSchemaFor(Locations),
              filterActivity: {
                type: 'object',
                properties: {
                  where: getWhereSchemaFor(Activity),
                  dateSearch: {
                    type: 'string',
                  },
                },
              },
              filterTour: {
                type: 'object',
                properties: {
                  where: getWhereSchemaFor(Tour),
                  startDay: {
                    type: 'string',
                  },
                },
              },
              searchType: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    locationSearch: {
      q: string;
      coordinates: string;
      offset: number;
      limit: number;
      distance: number;
      skip: number;
      where: Where<Locations>;
      isFull: boolean;
      order: string[];
      filterActivity?: IActivitySearchInput;
      filterTour?: ITourSearchInput;
      searchType?: string;
    },
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{data: Object[]; count: number}> {
    try {
      const userId = parseInt(userProfile[securityId]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {q, isFull, coordinates, distance, filterActivity, filterTour, searchType, ...filter} = {
        ...locationSearch,
        where: locationSearch?.where,
      };
      const searchResult = await this.locationsLogicController.search(
        filter,
        locationSearch?.q,
        locationSearch?.coordinates,
        locationSearch?.distance,
        locationSearch?.isFull && JSON.parse(String(locationSearch?.isFull).toLowerCase())
          ? LocationIsFullEnum.full
          : LocationIsFullEnum.normal,
        locationSearch?.filterActivity,
        locationSearch?.filterTour,
        locationSearch?.searchType,
      );
      const scopeRanking: Filter<Rankings> = {
        where: {
          userId,
        },
      };
      const scopeMyMap: Filter<MyLocations> = {
        where: {
          userId,
          myMapType: {
            inq: [MYMAP_TYPE_SAVED, MYMAP_TYPE_HAD_CAME],
          },
        },
      };
      if (!isEmpty(searchResult)) {
        let count: number;
        // eslint-disable-next-line prefer-const
        count = getProperty(searchResult, 'body.hits.total.value', 0);
        const hit = getProperty(searchResult, 'body.hits.hits', []);
        const getIdFromHit = (item: {
          _source: {
            id: number;
          };
        }) => {
          return item._source.id || 0;
        };
        let listResultId = Array.from(hit, getIdFromHit);
        const listResult: AnyObject = {};
        Array.from(hit, (item: AnyObject) => {
          if (item) {
            listResult[item._source.id] = Math.round(Number(item?.fields?.distance[0]));
          }
        });
        listResultId = listResultId.filter((item) => item);
        // let listResultId: string | any[] = [];
        if (listResultId.length) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          delete locationSearch?.q;
          const query: Filter<Locations> = {
            ...{
              include: [
                {
                  relation: 'rankings',
                  scope: scopeRanking,
                },
                {
                  relation: 'myLocations',
                  scope: scopeMyMap,
                },
                {
                  relation: 'interestings',
                  scope: {
                    where: {
                      userId,
                    },
                  },
                },
              ],
            },
            ...{
              where: {
                id: {
                  inq: listResultId,
                },
              },
            },
          };
          const data = await this.locationsRepository.find(query);
          let result = sortByList(data, 'id', listResultId);
          result = await Promise.all(
            result.map((location) => {
              return this.locationsLogicController.handleSearchResult(location, userId);
            }),
          );
          const dataOrdering = result.map((item) => {
            return {
              ...item,
              distance: item.id ? listResult[item.id] : null,
              rated: !!(item.rankings && item.rankings.length),
              checkin: !!(item.myLocations && item.myLocations.length),
            };
          });
          return {
            data: dataOrdering,
            count: count,
          };
        } else {
          if (
            !has(filter.where, 'locationType') ||
            getProperty(filter.where, 'locationType') === LocationTypesEnum.google ||
            getProperty(filter.where, 'locationType')?.inq?.includes(LocationTypesEnum.google)
          ) {
            const dataSearch = await getLocationWithKeywordSearch(q);
            const placeIds = dataSearch.map((item: any) => item.place_id);
            for (const iterator of placeIds) {
              const dataSearchDetail = await getDetailLocationWithPlaceIdFormatted(iterator);
              if (!isEmpty(dataSearchDetail)) {
                const newLocation = {
                  name: dataSearchDetail.name,
                  placeId: dataSearchDetail.placeId,
                  locationType: LocationTypesEnum.google.toString(),
                  country: dataSearchDetail.country,
                  areaLevel1: dataSearchDetail.administrativeAreaLevel1,
                  areaLevel2: dataSearchDetail.administrativeAreaLevel2,
                  areaLevel3: dataSearchDetail.administrativeAreaLevel3,
                  areaLevel4: dataSearchDetail.route,
                  areaLevel5: dataSearchDetail.streetNumber,
                  address: dataSearchDetail.formattedAddress,
                  formatedAddress: dataSearchDetail.formattedAddress,
                  coordinates: dataSearchDetail.coordinates,
                  userId: 1,
                };
                const checkLocationExist = await this.locationsRepository.count({
                  placeId: dataSearchDetail.placeId,
                });
                !checkLocationExist.count &&
                  (await this.locationsLogicController.create(newLocation).catch((e) => handleError(e)));
              }
              const query: Filter<Locations> = {
                ...{
                  where: {
                    placeId: {
                      inq: placeIds,
                    },
                  },
                },
              };
              const dataLocationWithGoogleApi = await this.locationsRepository.find(query);
              return {
                data: dataLocationWithGoogleApi,
                count: placeIds.length,
              };
            }
          }
          return {
            data: [],
            count: 0,
          };
        }
      }
      return {
        data: [],
        count: 0,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/locations/{locationId}/change-request', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Request change location',
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
  async changeRequest(
    @param.path.number('locationId') locationId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @requestBody(LOCATION_CHANGE_REQUEST_BODY) body: ILocationChangeRequest,
  ): Promise<{success: boolean}> {
    const userId = parseInt(userProfile[securityId]);
    const status = LocationChangeRequestStatus.REQUESTED;
    const payload: ILocationChangeRequest = {
      ...body,
      userId,
      locationId,
      status,
    };

    return this.locationsHandler.changeRequest(locationId, payload).catch((error) => handleError(error));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/locations/change-requests', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'get list location change request',
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
                  items: getModelSchemaRef(LocationRequests),
                },
              },
            },
          },
        },
      },
    },
  })
  async getChangeRequests(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(Posts, {name: 'filterPosts'})
    filter?: Filter<LocationRequests>,
  ): Promise<{count: number; data: LocationRequests[]}> {
    const formatFilterCustomer = (
      // eslint-disable-next-line no-shadow
      customer: UserProfile,
      // eslint-disable-next-line no-shadow
      filter?: Filter<LocationRequests>,
    ): Filter<LocationRequests> => {
      const userId = parseInt(customer[securityId]);
      const where = filter?.where ? {...filter.where, userId} : {userId: userId};
      return filter ? {...filter, where} : {where};
    };

    const filterRequest = formatFilterCustomer(userProfile, filter);

    return this.locationsHandler.findChangeRequests(filterRequest).catch((error) => handleError(error));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/locations/change-request/{id}/{status}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Request change location',
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
  async updateStatusChangeRequest(
    @param.path.number('id') id: number,
    @param.path.string('status') status: LocationChangeRequestStatus,
  ): Promise<{success: boolean}> {
    return this.locationsHandler.updateStatusChangeRequest(id, {status}).catch((error) => handleError(error));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/locations/{locationId}/delete-change-request', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Request change location',
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
  async deleteChangeRequest(
    @param.path.number('locationId') locationId: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{success: boolean}> {
    const userId = parseInt(userProfile[securityId]);
    return this.locationsHandler.deleteChangeRequest(locationId, userId).catch((error) => handleError(error));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/locations/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Locations model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(Locations, {
                        title: 'LocationInfo',
                        exclude: ['deletedAt', 'createdAt', 'updatedAt', 'userId'],
                      }).definitions['LocationInfo'].properties,
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
                      tour: {
                        type: 'object',
                        properties: {
                          currency: getModelSchemaRef(Currency),
                          tourName: {
                            type: 'string',
                          },
                          id: {
                            type: 'number',
                          },
                          price: {
                            type: 'number',
                          },
                          destinations: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: {
                                  type: 'string',
                                },
                                formatedAddress: {
                                  type: 'string',
                                },
                              },
                            },
                          },
                          vehicleServices: {
                            type: 'array',
                            items: {
                              type: 'string',
                            },
                          },
                          totalRanking: {
                            type: 'number',
                          },
                          totalTourTime: {
                            type: 'object',
                            properties: {
                              day: {
                                type: 'number',
                              },
                              night: {
                                type: 'number',
                              },
                            },
                          },
                        },
                      },
                      hadInteresting: {
                        type: 'boolean',
                      },
                    },
                  },
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
  async searchAll(
    @param({
      name: 'locationSearchAll',
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
              isFull: {
                type: 'boolean',
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
              where: getWhereSchemaFor(Locations),
              filterActivity: {
                type: 'object',
                properties: {
                  where: getWhereSchemaFor(Activity),
                  dateSearch: {
                    type: 'string',
                  },
                },
              },
              filterTour: {
                type: 'object',
                properties: {
                  where: getWhereSchemaFor(Tour),
                  startDay: {
                    type: 'string',
                  },
                },
              },
              searchType: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    locationSearch: ILocationSearchInput,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{data: Object[]; count: number}> {
    return this.locationsHandler.searchAll(locationSearch, userProfile);
  }

  @del('/location/{id}/delete', {
    responses: {
      '204': {
        description: 'Location DELETE success',
      },
    },
  })
  async deleteLocationById(@param.path.number('id') id: number): Promise<void> {
    return this.locationsHandler.deleteLocationById(id);
  }

  @patch('/locations/average-point', {
    responses: {
      '200': {
        description: 'Request Update Average Point Location',
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
  async updateAveragePoint(
    @param.query.string('updateAveragePointAt') updateAveragePointAt?: string,
  ): Promise<{success: boolean}> {
    const updateAveragePointTime = updateAveragePointAt
      ? dayjs.utc(updateAveragePointAt).toISOString()
      : dayjs.utc().toISOString();

    return this.locationsHandler.updateAveragePoint(updateAveragePointTime);
  }
}

export function locationInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Locations).definitions.Locations.properties,
      distance: {
        type: 'number',
      },
      posts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ...getModelSchemaRef(Posts).definitions.Posts.properties,
            mediaContents: {
              type: 'array',
              items: getModelSchemaRef(MediaContents),
            },
          },
        },
      },
    },
  };
}

export function newLocationInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Locations).definitions.Locations.properties,
      hadInteresting: {
        type: 'boolean',
      },
      totalPosts: {
        type: 'number',
      },
      interesting: getModelSchemaRef(Interesting),
      distance: {
        type: 'number',
      },
      isSavedLocation: {
        type: 'boolean',
      },
      savedToBookmark: {
        type: 'boolean',
      },
      rated: {
        type: 'boolean',
      },
      checkin: {
        type: 'boolean',
      },
      tour: {
        type: 'object',
        properties: {
          currency: getModelSchemaRef(Currency),
          tourName: {
            type: 'string',
          },
          id: {
            type: 'number',
          },
          price: {
            type: 'number',
          },
          currencyId: {
            type: 'number',
          },
          destinations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
                formatedAddress: {
                  type: 'string',
                },
              },
            },
          },
          vehicleServices: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          totalRanking: {
            type: 'number',
          },
          totalTourTime: {
            type: 'object',
            properties: {
              day: {
                type: 'number',
              },
              night: {
                type: 'number',
              },
            },
          },
        },
      },
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
      page: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Page).definitions.Page.properties,
          stayPropertytype: getModelSchemaRef(PropertyType),
        },
      },
      pageFoodReview: {
        type: 'object',
        properties: {
          totalReview: {
            type: 'number',
          },
          averagePoint: {
            type: 'number',
          },
        },
      },
      pageFoodGeneralInformation: {
        type: 'object',
        properties: {
          typeOfRestaurant: {
            type: 'string',
          },
          businessHours: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(BusinessHoursObject).definitions.BusinessHoursObject.properties,
            },
          },
          menu: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
            },
          },
          view: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
            },
          },
        },
      },
      pageFoodPrice: {
        type: 'object',
        properties: {
          minPrice: {
            type: 'object',
            properties: {
              value: {
                type: 'number',
              },
              currency: getModelSchemaRef(Currency),
            },
          },
          maxPrice: {
            type: 'object',
            properties: {
              value: {
                type: 'number',
              },
              currency: getModelSchemaRef(Currency),
            },
          },
        },
      },
      stay: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Stay).definitions.Stay.properties,
          accommodationType: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(AccommodationType).definitions.AccommodationType.properties,
            },
          },
        },
      },
      service: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Service).definitions.Service.properties,
          currency: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Currency).definitions.Currency.properties,
            },
          },
        },
      },
      activity: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Activity, {
            title: 'NewActivityExclude',
          }).definitions.NewActivityExclude.properties,
          introduction: {
            type: 'string',
          },
          location: getModelSchemaRef(Locations, {
            exclude: [
              'id',
              'name',
              'createdAt',
              'deletedAt',
              'averagePoint',
              'totalReview',
              'updatedAt',
              'userId',
              'status',
            ],
          }),
          currency: getModelSchemaRef(Currency),
          mediaContents: {
            type: 'array',
            items: getModelSchemaRef(MediaContents),
          },
          post: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Posts, {
                exclude: ['listUsersReceiveNotifications'],
                title: 'contentPost',
              }).definitions.contentPost.properties,
              location: getModelSchemaRef(Locations),
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
              creator: userInfoSchema(),
              liked: {
                type: 'boolean',
              },
              marked: {
                type: 'boolean',
              },
              rated: {
                type: 'boolean',
              },
              isSavedLocation: {
                type: 'boolean',
              },
            },
          },
          joined: {
            type: 'boolean',
          },
          participantCount: {
            type: 'number',
          },
        },
      },
    },
  };
}
