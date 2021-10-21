import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/context';
import {del, get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';

import {
  Booking,
  BookingWithRelations,
  CancellationPolicyObject,
  Currency,
  DepartureLocationObject,
  DestinationObject,
  Locations,
  MediaContents,
  ModelFilterStayClass,
  Page,
  Posts,
  Rankings,
  Service,
  Stay,
  StayReservation,
  StayWithRelations,
  TimeToOrganizeTour,
  TotalTourTimeObject,
  Tour,
} from '../../models';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {ServiceHandler} from './service.handler';
import {AUTHORIZE_CUSTOMER, AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {
  ResponseServiceFoodDetailInterface,
  schemaRequestBodyStay,
  schemaResponseStayDetail,
  ServiceBodyPostRequest,
  ServiceTourBodyTourRequest,
  ServiceTourResponse,
  TourDetailInterface,
  ServiceDetailResponseInterface,
} from './service.constant';
import {contentResponseSuccess} from '../../constants/response.constant';
import {handleError} from '../../utils/handleError';
import {filters} from '../../utils/Filter';
import {Filter, FilterExcludingWhere, Where} from '@loopback/repository';
import {LocationStayInterface} from '../util/util-interface';
import {newLocationInfoSchema} from '..';
import {FindPageServiceTourResponseInterface} from '../pages/page.interface';
import {BookingStatusEnum} from '../booking/booking.constant';
import moment from 'moment';
import _ from 'lodash';

export class ServiceController {
  constructor(
    @inject(HandlerBindingKeys.SERVICE_HANDLER)
    public serviceHandler: ServiceHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/services/food', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service model instance',
        content: {'application/json': {schema: getModelSchemaRef(Posts)}},
      },
    },
  })
  async createFood(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'newServiceFood',
            type: 'object',
            properties: {
              ...getModelSchemaRef(Posts, {
                title: 'newServiceFoodPost',
                exclude: [
                  'id',
                  'averagePoint',
                  'totalRanking',
                  'listUsersReceiveNotifications',
                  'totalLike',
                  'totalShare',
                  'totalComment',
                  'createdAt',
                  'updatedAt',
                  'creatorId',
                  'postType',
                  'locationId',
                  'sourcePostId',
                  'isPublicLocation',
                  'backgroundPost',
                  'accessType',
                  'pageId',
                ],
              }).definitions['newServiceFoodPost'].properties,
              ...getModelSchemaRef(Service, {
                title: 'newServiceFood',
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'type', 'postId'],
              }).definitions['newServiceFood'].properties,
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  title: 'mediaContentServiceFood',
                  exclude: ['postId'],
                }),
              },
            },
            required: ['content', 'pageId', 'mediaContents', 'service', 'name', 'price', 'currencyId'],
          },
        },
      },
    })
    service: ServiceBodyPostRequest,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Service | null> {
    return this.serviceHandler.createFood(service, {currentUser});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/services/food/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Services model instance',
        content: contentResponseSuccess,
      },
    },
  })
  async updateFood(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'updateServiceFoodById',
            type: 'object',
            properties: {
              ...getModelSchemaRef(Posts, {
                title: 'updateServiceFoodPost',
                exclude: [
                  'id',
                  'averagePoint',
                  'totalRanking',
                  'listUsersReceiveNotifications',
                  'totalLike',
                  'totalShare',
                  'totalComment',
                  'createdAt',
                  'updatedAt',
                  'creatorId',
                  'postType',
                  'locationId',
                  'sourcePostId',
                  'isPublicLocation',
                  'backgroundPost',
                  'accessType',
                  'pageId',
                ],
              }).definitions['updateServiceFoodPost'].properties,
              ...getModelSchemaRef(Service, {
                title: 'updateServiceFood',
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'pageId', 'type', 'postId'],
              }).definitions['updateServiceFood'].properties,
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  title: 'updateMediaContentServiceFood',
                  exclude: ['postId'],
                }),
              },
            },
            required: ['content', 'mediaContents', 'service', 'name', 'price', 'currencyId'],
          },
        },
      },
    })
    service: ServiceBodyPostRequest,
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<{success: boolean}> {
    return this.serviceHandler.updateFood(id, service, {currentUser});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @del('/services/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service DELETE success',
        content: contentResponseSuccess,
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<{success: boolean}> {
    return this.serviceHandler.deleteById(id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/services/food/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Posts, {
                  exclude: ['listUsersReceiveNotifications'],
                  title: 'contentService',
                }).definitions.contentService.properties,
                mediaContents: {
                  type: 'array',
                  items: getModelSchemaRef(MediaContents),
                },
                creator: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    avatar: getModelSchemaRef(MediaContents),
                  },
                },
                name: {
                  type: 'string',
                },
                price: {
                  type: 'number',
                },
                currency: getModelSchemaRef(Currency),
                liked: {
                  type: 'boolean',
                },
                marked: {
                  type: 'boolean',
                },
                rated: {
                  type: 'boolean',
                },
                flag: {
                  type: 'number',
                },
                postId: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    },
  })
  async findFoodById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<ResponseServiceFoodDetailInterface> {
    const userId = parseInt(currentUser[securityId]);
    return this.serviceHandler.findFoodById(id, {userId}).catch((e) => {
      return handleError(e);
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/services/tour', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service model instance',
        content: {'application/json': {schema: getModelSchemaRef(Tour)}},
      },
    },
  })
  async createTour(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'newServiceTour',
            type: 'object',
            properties: {
              // media of tour
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
              // init properties of tour
              ...getModelSchemaRef(Tour, {
                title: 'newTour',
                exclude: [
                  'id',
                  'createdAt',
                  'updatedAt',
                  'deletedAt',
                  'programs',
                  'locationId',
                  'serviceId',
                  'destinations',
                  'departureLocation',
                  'dateOff',
                  'holidays',
                  'vehicleServices',
                  'includeServices',
                ],
              }).definitions['newTour'].properties,
              dateOff: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              holidays: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              vehicleServices: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              includeServices: {
                type: 'array',
                items: {
                  type: 'string',
                },
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
              // destination list of tour
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
              cancellationPolicy: {
                type: 'object',
                properties: {
                  freeCancellation: {
                    type: 'boolean',
                  },
                  conditionalCancellation: {
                    type: 'boolean',
                  },
                  text: {
                    type: 'string',
                  },
                },
              },
              // init properties or service
              ...getModelSchemaRef(Service, {
                title: 'newServiceTour',
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'type', 'postId', 'price'],
              }).definitions['newServiceTour'].properties,
              // program list of tour
              programs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    timeTitle: {
                      type: 'string',
                    },
                    scheduleDay: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timeTitle: {
                            type: 'string',
                          },
                          description: {
                            type: 'string',
                          },
                          mediaContents: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: getModelSchemaRef(MediaContents, {
                                title: 'mediaTour',
                                exclude: ['deletedAt', 'postId'],
                              }).definitions.mediaTour.properties,
                            },
                          },
                        },
                        required: ['timeTitle', 'description', 'mediaContents'],
                      },
                    },
                  },
                  required: ['timeTitle', 'scheduleDay'],
                },
              },
              timeToOrganizeTour: {
                type: 'array',
                items: getModelSchemaRef(TimeToOrganizeTour, {
                  exclude: ['id', 'tourId', 'createdAt', 'updatedAt', 'deletedAt'],
                }),
              },
              pickupDropoffLocation: {
                type: 'object',
                properties: {
                  custormerLocationChoose: {
                    type: 'boolean',
                  },
                  accordingToTheRulesOfTheTour: {
                    type: 'boolean',
                  },
                  pickupPoint: {
                    type: 'string',
                  },
                  dropoffPoint: {
                    type: 'string',
                  },
                },
              },

              // init location info
              location: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(Locations, {
                    title: 'newLocationTour',
                    exclude: [
                      'id',
                      'userId',
                      'createdAt',
                      'updatedAt',
                      'locationType',
                      'totalReview',
                      'averagePoint',
                      'status',
                    ],
                  }).definitions['newLocationTour'].properties,
                  text: {
                    type: 'string',
                  },
                },
                required: [
                  'coordinates',
                  'latitude',
                  'longitude',
                  'formatedAddress',
                  'address',
                  'country',
                  'areaLevel1',
                  'areaLevel2',
                  'name',
                ],
              },
            },
            required: [
              'destinations',
              'normalAdultPrice',
              'normalChildPrice',
              'holidayAdultPrice',
              'holidayChildPrice',
              'type',
              'vehicleServices',
              'cancellationPolicy',
              'includeServices',
              'name',
              'pageId',
              'currencyId',
              'programs',
              'location',
              'pickupDropoffLocation',
            ],
          },
        },
      },
    })
    service: ServiceTourBodyTourRequest,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<ServiceTourResponse> {
    return this.serviceHandler.createTour(service, {currentUser});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/service/tour/check-full-passenger', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Check full passenger when booking tour',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                isFull: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async checkFullPassenger(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'checkFullPassenger',
            type: 'object',
            properties: {
              serviceId: {
                type: 'number',
              },
              startDate: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: {
      serviceId: number;
      startDate: string;
    },
  ): Promise<{isFull: boolean}> {
    try {
      const [booking, tour] = await Promise.all([
        this.serviceHandler.bookingRepository.find({
          include: [
            {
              relation: 'tourReservation',
            },
          ],
          where: {
            serviceId: request.serviceId,
            status: BookingStatusEnum.confirmed,
          },
        }),
        this.serviceHandler.getTourInfo(request.serviceId),
      ]);
      const bookingsWithDateSearch =
        booking?.filter((item) => {
          return moment(moment(item?.tourReservation?.startDate).startOf('day').toISOString()).isSame(
            moment(request.startDate).startOf('day').toISOString(),
          );
        }) || [];
      return {
        isFull: bookingsWithDateSearch.length >= (tour?.maxPassenger || 0),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/page/{pageId}/services/tour', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Posts model instances',
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
                      ...getModelSchemaRef(Service).definitions.Service.properties,
                      attachments: {
                        type: 'array',
                        items: getModelSchemaRef(MediaContents),
                      },
                      content: {
                        type: 'string',
                      },
                      totalRanking: {
                        type: 'number',
                      },
                      ranking: getModelSchemaRef(Rankings),
                      post: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Posts, {
                            exclude: ['listUsersReceiveNotifications'],
                            title: 'contentPost',
                          }).definitions.contentPost.properties,
                          mediaContents: {
                            type: 'array',
                            items: getModelSchemaRef(MediaContents),
                          },
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
                      tour: {
                        type: 'object',
                        properties: {
                          destinations: {
                            type: 'array',
                            items: getModelSchemaRef(DestinationObject),
                          },
                          vehicleServices: {
                            type: 'array',
                            items: {
                              type: 'string',
                            },
                          },
                          totalTourTime: getModelSchemaRef(TotalTourTimeObject),
                        },
                      },
                      currency: getModelSchemaRef(Currency),
                      locationId: {
                        type: 'number',
                      },
                      isSavedLocation: {
                        type: 'boolean',
                      },
                      rated: {
                        type: 'boolean',
                      },
                      averagePoint: {
                        type: 'number',
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
  async findServiceTour(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('pageId') pageId: number,
    @param.filter(Service, {name: 'filterPagesServiceTour'})
    filter?: Filter<Service>,
  ): Promise<{
    count: number;
    data: FindPageServiceTourResponseInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.serviceHandler.findServiceTour(userId, pageId, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/services/stay', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service model instance',
        content: {
          'application/json': {
            schema: {type: 'object', properties: {success: {type: 'boolean'}}},
          },
        },
      },
    },
  })
  async createStay(
    @requestBody({
      content: {
        'application/json': {
          schema: schemaRequestBodyStay('New'),
        },
      },
    })
    stay: Partial<StayWithRelations> & {pageId: number},
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<{success: boolean}> {
    await this.serviceHandler.createStay(stay, currentUser);
    return {success: true};
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/services/stay/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Service model instance',
        content: {
          'application/json': {
            schema: {type: 'object', properties: {success: {type: 'boolean'}}},
          },
        },
      },
    },
  })
  async updateStayById(
    @requestBody({
      content: {
        'application/json': {
          schema: schemaRequestBodyStay('Update'),
        },
      },
    })
    stay: Partial<StayWithRelations> & {pageId: number},
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<{success: true}> {
    await this.serviceHandler.updateStayById(id, stay, currentUser);
    return {success: true};
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/services/stay/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service model instance',
        content: {
          'application/json': {
            schema: schemaResponseStayDetail('StayDetail'),
          },
        },
      },
    },
  })
  async findStayById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<ServiceDetailResponseInterface> {
    return this.serviceHandler.findStayById(id, currentUser);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page/{pageId}/services/{serviceId}/tour', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'GET service tour by serviceId',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Tour).definitions.Tour.properties,
                timeToOrganizeTours: {
                  type: 'array',
                  items: getModelSchemaRef(TimeToOrganizeTour),
                },
                departureLocation: getModelSchemaRef(DepartureLocationObject),
                dateOff: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                holidays: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                vehicleServices: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                includeServices: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                location: getModelSchemaRef(Locations),
                isSavedLocation: {
                  type: 'boolean',
                },
                service: getModelSchemaRef(Service),
                currency: getModelSchemaRef(Currency),
                page: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Page).definitions.Page.properties,
                    name: {
                      type: 'string',
                    },
                    avatar: getModelSchemaRef(MediaContents),
                  },
                },
                mediaContents: {
                  type: 'array',
                  items: getModelSchemaRef(MediaContents),
                },
                name: {
                  type: 'string',
                },
                flag: {
                  type: 'number',
                },
                post: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Posts, {
                      exclude: ['listUsersReceiveNotifications'],
                      title: 'contentPost',
                    }).definitions.contentPost.properties,
                    liked: {
                      type: 'boolean',
                    },
                  },
                },
                rated: {
                  type: 'boolean',
                },
                averagePoint: {
                  type: 'number',
                },
                totalRanking: {
                  type: 'number',
                },
                ranking: getModelSchemaRef(Rankings),
              },
            },
          },
        },
      },
    },
  })
  async findTourByTourId(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('pageId') pageId: number,
    @param.path.number('serviceId') serviceId: number,
  ): Promise<TourDetailInterface> {
    const userId = parseInt(currentUser[securityId]);
    return this.serviceHandler
      .findTourByTourId({
        userId,
        pageId,
        serviceId,
      })
      .catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/page/{pageId}/services/{serviceId}/tour', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Tour model instance',
        content: {'application/json': {schema: getModelSchemaRef(Tour)}},
      },
    },
  })
  async updateTour(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'updateServiceTour',
            type: 'object',
            properties: {
              // media of tour
              mediaContents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
                  },
                },
              },
              // init properties of tour
              ...getModelSchemaRef(Tour, {
                title: 'newTour',
                exclude: [
                  'id',
                  'createdAt',
                  'updatedAt',
                  'deletedAt',
                  'programs',
                  'locationId',
                  'serviceId',
                  'destinations',
                  'departureLocation',
                  'dateOff',
                  'holidays',
                  'vehicleServices',
                  'includeServices',
                ],
              }).definitions['newTour'].properties,
              dateOff: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              holidays: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              vehicleServices: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              includeServices: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              // destination list of tour
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
              totalTourTime: getModelSchemaRef(TotalTourTimeObject),
              // init properties or service
              ...getModelSchemaRef(Service, {
                title: 'newServiceTour',
                exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'type', 'postId', 'pageId', 'price'],
              }).definitions['newServiceTour'].properties,

              // program list of tour
              programs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    timeTitle: {
                      type: 'string',
                    },
                    scheduleDay: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timeTitle: {
                            type: 'string',
                          },
                          description: {
                            type: 'string',
                          },
                          mediaContents: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: getModelSchemaRef(MediaContents, {
                                title: 'mediaTour',
                                exclude: ['deletedAt', 'postId'],
                              }).definitions.mediaTour.properties,
                            },
                          },
                        },
                        required: ['timeTitle', 'description', 'mediaContents'],
                      },
                    },
                  },
                  required: ['timeTitle', 'scheduleDay'],
                },
              },
              timeToOrganizeTour: {
                type: 'array',
                items: getModelSchemaRef(TimeToOrganizeTour, {
                  exclude: ['id', 'tourId', 'createdAt', 'updatedAt', 'deletedAt'],
                }),
              },
              pickupDropoffLocation: {
                type: 'object',
                properties: {
                  custormerLocationChoose: {
                    type: 'boolean',
                  },
                  accordingToTheRulesOfTheTour: {
                    type: 'boolean',
                  },
                  pickupPoint: {
                    type: 'string',
                  },
                  dropoffPoint: {
                    type: 'string',
                  },
                },
              },
              cancellationPolicy: getModelSchemaRef(CancellationPolicyObject),
              // init location info
              location: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(Locations, {
                    title: 'newLocationTour',
                    exclude: [
                      'id',
                      'userId',
                      'createdAt',
                      'updatedAt',
                      'locationType',
                      'totalReview',
                      'averagePoint',
                      'status',
                    ],
                  }).definitions['newLocationTour'].properties,
                  text: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    })
    service: ServiceTourBodyTourRequest,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('serviceId') serviceId: number,
    @param.path.number('pageId') pageId: number,
  ): Promise<ServiceTourResponse> {
    const userId = parseInt(currentUser[securityId]);
    return this.serviceHandler.updateTour({
      serviceId,
      pageId,
      userId,
      data: service,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/services/stay', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Stay model instance',
        content: {
          'application/json': {
            schema: {
              title: 'StayServices',
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'ListStay',
                  type: 'array',
                  items: schemaResponseStayDetail('ListStay'),
                },
              },
            },
          },
        },
      },
    },
  })
  async findStay(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(Stay, {name: 'filterStay'}) filter?: Filter<Stay>,
  ): Promise<{count: number; data: ServiceDetailResponseInterface[]}> {
    return this.serviceHandler.findStay({
      filter,
      currentUser,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/services/{serviceId}/stay/bookings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Bookings stay model by service',
        content: {
          'application/json': {
            schema: {
              title: 'StayServices',
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'ListBookingStay',
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(Booking).definitions.Booking.properties,
                      stayReservation: getModelSchemaRef(StayReservation),
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
  async getListBookingOfService(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('serviceId') serviceId: number,
  ): Promise<{count: number; data: BookingWithRelations[]}> {
    return this.serviceHandler.getListBookingOfService(serviceId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/services/stayFilter', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Stay model instance',
        content: {
          'application/json': {
            schema: {
              title: 'StayServicesFilter',
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'ListServiceStay',
                  type: 'array',
                  items: schemaResponseStayDetail('ListServiceStay'),
                },
              },
            },
          },
        },
      },
    },
  })
  async filterStay(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param({
      name: 'dateRange',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              checkoutDate: {
                type: 'string',
              },
              checkinDate: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    dateRange: {
      checkoutDate?: string;
      checkinDate?: string;
    },
    @param.filter(Stay, {name: 'filterStayOption'}) filter?: Filter<Stay>,
  ): Promise<{count: number; data: ServiceDetailResponseInterface[]}> {
    return this.serviceHandler.filterStay({
      filter: filters(filter),
      currentUser,
      dateRange,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/services/stay/search', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Stay model instance',
        content: {
          'application/json': {
            schema: {
              title: 'StayServices',
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
  async searchStay(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param({
      name: 'stayFilterSearch',
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
              distance: {
                type: 'number',
              },
              checkoutDate: {
                type: 'string',
              },
              checkinDate: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    stayFilterSearch: {
      q?: string;
      coordinates?: string;
      distance?: number;
      checkoutDate?: string;
      checkinDate?: string;
    },
    @param.filter(Service, {
      name: 'filterServiceStay',
      exclude: ['where', 'fields', 'include', 'skip'],
    })
    filter?: FilterExcludingWhere<Service>,
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    @param.where(ModelFilterStayClass, 'whereStay')
    where?: Where<ModelFilterStayClass>,
  ): Promise<{count: number; data: Partial<LocationStayInterface>[]}> {
    const userId = parseInt(currentUser[securityId]);
    return this.serviceHandler.handleSearchStay({
      where,
      ...stayFilterSearch,
      filter,
      userId,
    });
  }
}
