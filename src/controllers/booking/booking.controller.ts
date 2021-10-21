import {Filter} from '@loopback/repository';
import {post, getModelSchemaRef, requestBody, param, get, patch} from '@loopback/rest';
import {
  Booking,
  TourReservation,
  UserInfo,
  BookingRelations,
  Currency,
  Users,
  Profiles,
  Avatars,
  MediaContents,
  Tour,
  Service,
  StayReservation,
  Stay,
  Page,
  Locations,
  AccommodationType,
  ServiceReview,
  Posts,
} from '../../models';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {inject} from '@loopback/core';
import {BookingHandler} from './booking.handler';
import {BookingTypeEnum, PayMethodEnum} from './booking.constant';
import {BookingStayInput, BookingTourInput} from './booking.interface';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_CUSTOMER} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';

export class BookingController {
  constructor(
    @inject(HandlerBindingKeys.BOOKING_HANDLER)
    public bookingHandler: BookingHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/bookings/tour', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              ...getModelSchemaRef(Booking),
            },
          },
        },
      },
    },
  })
  async createBookingTour(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'newBookingTour',
            type: 'object',
            properties: {
              ...getModelSchemaRef(TourReservation, {
                title: 'NewTourReservation',
                exclude: [
                  'id',
                  'reservationCode',
                  'userInfo',
                  'metadata',
                  'createdAt',
                  'updatedAt',
                  'deletedAt',
                  'tourId',
                  'otherUserInfo',
                ],
              }).definitions['NewTourReservation'].properties,
              userInfo: getModelSchemaRef(UserInfo, {
                title: 'UserInfo',
              }),
              otherUserInfo: getModelSchemaRef(UserInfo, {
                title: 'OtherUserInfo',
              }),
              payMethod: {
                type: 'string',
                enum: [PayMethodEnum.postpaid],
              },
              timeOrganizeId: {
                type: 'number',
              },
              serviceId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    booking: BookingTourInput,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Booking> {
    const userId = parseInt(currentUser[securityId]);
    return this.bookingHandler.createBookingTour(booking, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/bookings/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'newBookingTour',
              type: 'object',
              properties: {
                ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                tourReservation: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(TourReservation, {
                      title: 'tourReservation',
                    }).definitions['tourReservation'].properties,
                    tour: getModelSchemaRef(Tour),
                  },
                },
                stayReservation: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(StayReservation, {
                      title: 'stayReservation',
                    }).definitions['stayReservation'].properties,
                    stay: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Stay, {title: 'stay'}).definitions['stay'].properties,
                        accommodationType: getModelSchemaRef(AccommodationType),
                        mediaContents: {
                          type: 'array',
                          items: getModelSchemaRef(MediaContents),
                        },
                      },
                    },
                  },
                },
                serviceReviewItem: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(ServiceReview, {title: 'servieReview'}).definitions['servieReview'].properties,
                    post: getModelSchemaRef(Posts),
                  },
                },
                currency: getModelSchemaRef(Currency),
                createdBy: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                    relatedPageId: {
                      type: 'number',
                    },
                    profiles: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                        avatars: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Avatars, {title: 'avatar'}).definitions['avatar'].properties,
                            mediaContent: getModelSchemaRef(MediaContents),
                          },
                        },
                      },
                    },
                  },
                },
                service: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Service).definitions.Service.properties,
                    post: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Posts).definitions.Posts.properties,
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
                        location: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Locations).definitions.Locations.properties,
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
  async findById(@param.path.number('id') id: number): Promise<Booking & BookingRelations> {
    return this.bookingHandler.findById(id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/booking-stay/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Stay model instance',
        content: {
          'application/json': {
            schema: {
              title: 'newBookingStay',
              type: 'object',
              properties: {
                ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                stayReservation: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(StayReservation, {
                      title: 'stayReservation',
                    }).definitions['stayReservation'].properties,
                    stay: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Stay, {title: 'stay'}).definitions['stay'].properties,
                        accommodationType: getModelSchemaRef(AccommodationType),
                        mediaContents: {
                          type: 'array',
                          items: getModelSchemaRef(MediaContents),
                        },
                      },
                    },
                  },
                },
                serviceReviewItem: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(ServiceReview, {title: 'servieReview'}).definitions['servieReview'].properties,
                    post: getModelSchemaRef(Posts),
                  },
                },
                currency: getModelSchemaRef(Currency),
                createdBy: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                    relatedPageId: {
                      type: 'number',
                    },
                    profiles: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                        avatars: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Avatars, {title: 'avatar'}).definitions['avatar'].properties,
                            mediaContent: getModelSchemaRef(MediaContents),
                          },
                        },
                      },
                    },
                  },
                },
                service: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Service).definitions.Service.properties,
                    page: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Page).definitions.Page.properties,
                        location: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Locations).definitions.Locations.properties,
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
  async findBookingStayById(@param.path.number('id') id: number): Promise<Booking & BookingRelations> {
    return this.bookingHandler.findBookingStayById(id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/booking-tour/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'newBookingTour',
              type: 'object',
              properties: {
                ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                tourReservation: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(TourReservation, {
                      title: 'tourReservation',
                    }).definitions['tourReservation'].properties,
                    tour: getModelSchemaRef(Tour),
                  },
                },
                serviceReviewItem: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(ServiceReview, {title: 'servieReview'}).definitions['servieReview'].properties,
                    post: getModelSchemaRef(Posts),
                  },
                },
                currency: getModelSchemaRef(Currency),
                createdBy: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                    relatedPageId: {
                      type: 'number',
                    },
                    profiles: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                        avatars: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Avatars, {title: 'avatar'}).definitions['avatar'].properties,
                            mediaContent: getModelSchemaRef(MediaContents),
                          },
                        },
                      },
                    },
                  },
                },
                service: {
                  type: 'object',
                  title: 'serviceTour',
                  properties: {
                    ...getModelSchemaRef(Service).definitions.Service.properties,
                    page: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Page).definitions.Page.properties,
                        location: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Locations).definitions.Locations.properties,
                          },
                        },
                      },
                    },
                    post: {
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
  })
  async findBookingTourById(@param.path.number('id') id: number): Promise<Booking & BookingRelations> {
    return this.bookingHandler.findBookingTourById(id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/bookings', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'listBookings',
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
                      ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                      tourReservation: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(TourReservation, {
                            title: 'tourReservation',
                          }).definitions['tourReservation'].properties,
                          tour: getModelSchemaRef(Tour),
                        },
                      },
                      stayReservation: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(StayReservation, {
                            title: 'stayReservation',
                          }).definitions['stayReservation'].properties,
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
                              mediaContents: {
                                type: 'array',
                                items: getModelSchemaRef(MediaContents),
                              },
                            },
                          },
                        },
                      },
                      serviceReviewItem: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(ServiceReview, {
                            title: 'servieReview',
                          }).definitions['servieReview'].properties,
                          post: getModelSchemaRef(Posts),
                        },
                      },
                      currency: getModelSchemaRef(Currency),
                      createdBy: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                          relatedPageId: {
                            type: 'number',
                          },
                          profiles: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                              avatars: {
                                type: 'object',
                                properties: {
                                  ...getModelSchemaRef(Avatars, {
                                    title: 'avatar',
                                  }).definitions['avatar'].properties,
                                  mediaContent: getModelSchemaRef(MediaContents),
                                },
                              },
                            },
                          },
                        },
                      },
                      service: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Service).definitions.Service.properties,
                          page: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Page).definitions.Page.properties,
                              location: getModelSchemaRef(Locations),
                            },
                          },
                          post: {
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
  async findBooking(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(Booking, {name: 'filterBooking'}) filter?: Filter<Booking>,
    @param.query.string('keyword') keyword?: string,
    @param.query.boolean('isCustomer') isCustomer?: boolean,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
    @param.query.string('type') type?: BookingTypeEnum,
    @param.query.string('groupBy') groupBy?: 'startDate' | 'endDate',
    @param.query.number('accommodationTypeId') accommodationTypeId?: number,
  ): Promise<{data: (Booking & BookingRelations)[]; count: number}> {
    return this.bookingHandler.findBooking(filter || {}, {
      currentUser,
      keyword,
      startDate,
      endDate,
      type,
      groupBy,
      accommodationTypeId,
      isCustomer,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/bookings/stay', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'listBookings',
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
                      ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                      tourReservation: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(TourReservation, {
                            title: 'tourReservation',
                          }).definitions['tourReservation'].properties,
                          tour: getModelSchemaRef(Tour),
                        },
                      },
                      stayReservation: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(StayReservation, {
                            title: 'stayReservation',
                          }).definitions['stayReservation'].properties,
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
                              mediaContents: {
                                type: 'array',
                                items: getModelSchemaRef(MediaContents),
                              },
                            },
                          },
                        },
                      },
                      serviceReviewItem: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(ServiceReview, {
                            title: 'servieReview',
                          }).definitions['servieReview'].properties,
                          post: getModelSchemaRef(Posts),
                        },
                      },
                      currency: getModelSchemaRef(Currency),
                      createdBy: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                          relatedPageId: {
                            type: 'number',
                          },
                          profiles: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                              avatars: {
                                type: 'object',
                                properties: {
                                  ...getModelSchemaRef(Avatars, {
                                    title: 'avatar',
                                  }).definitions['avatar'].properties,
                                  mediaContent: getModelSchemaRef(MediaContents),
                                },
                              },
                            },
                          },
                        },
                      },
                      service: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Service).definitions.Service.properties,
                          page: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Page).definitions.Page.properties,
                              location: getModelSchemaRef(Locations),
                            },
                          },
                          post: {
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
  async findBookingStay(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(Booking, {name: 'filterBooking'}) filter?: Filter<Booking>,
    @param.query.string('keyword') keyword?: string,
    @param.query.boolean('isCustomer') isCustomer?: boolean,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
    @param.query.string('groupBy') groupBy?: 'startDate' | 'endDate',
    @param.query.number('accommodationTypeId') accommodationTypeId?: number,
  ): Promise<{data: (Booking & BookingRelations)[]; count: number}> {
    return this.bookingHandler.findBookingStay(filter || {}, {
      currentUser,
      keyword,
      startDate,
      endDate,
      groupBy,
      accommodationTypeId,
      isCustomer,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/bookings/tour', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'listBookings',
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
                      ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                      tourReservation: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(TourReservation, {
                            title: 'tourReservation',
                          }).definitions['tourReservation'].properties,
                          tour: getModelSchemaRef(Tour),
                        },
                      },
                      serviceReviewItem: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(ServiceReview, {
                            title: 'servieReview',
                          }).definitions['servieReview'].properties,
                          post: getModelSchemaRef(Posts),
                        },
                      },
                      currency: getModelSchemaRef(Currency),
                      createdBy: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                          relatedPageId: {
                            type: 'number',
                          },
                          profiles: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                              avatars: {
                                type: 'object',
                                properties: {
                                  ...getModelSchemaRef(Avatars, {
                                    title: 'avatar',
                                  }).definitions['avatar'].properties,
                                  mediaContent: getModelSchemaRef(MediaContents),
                                },
                              },
                            },
                          },
                        },
                      },
                      service: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Service).definitions.Service.properties,
                          page: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Page).definitions.Page.properties,
                              location: getModelSchemaRef(Locations),
                            },
                          },
                          post: {
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
  async findBookingTour(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(Booking, {name: 'filterBooking'}) filter?: Filter<Booking>,
    @param.query.string('keyword') keyword?: string,
    @param.query.boolean('isCustomer') isCustomer?: boolean,
    @param.query.string('startDate') startDate?: string,
    @param.query.string('endDate') endDate?: string,
    @param.query.string('groupBy') groupBy?: 'startDate' | 'endDate',
    @param.query.number('accommodationTypeId') accommodationTypeId?: number,
  ): Promise<{data: (Booking & BookingRelations)[]; count: number}> {
    return this.bookingHandler.findBookingTour(filter || {}, {
      currentUser,
      keyword,
      startDate,
      endDate,
      groupBy,
      isCustomer,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/bookings/{id}/confirmed', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'newBookingTour',
              type: 'object',
              properties: {
                ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                tourReservation: getModelSchemaRef(TourReservation),
                currency: getModelSchemaRef(Currency),
                createdBy: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                    relatedPageId: {
                      type: 'number',
                    },
                    profiles: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                        avatars: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Avatars, {title: 'avatar'}).definitions['avatar'].properties,
                            mediaContent: getModelSchemaRef(MediaContents),
                          },
                        },
                      },
                    },
                  },
                },
                service: getModelSchemaRef(Service),
              },
            },
          },
        },
      },
    },
  })
  async confirmBooking(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Booking & BookingRelations> {
    return this.bookingHandler.confirmBooking(id, currentUser);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/bookings/{id}/canceled', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Tour model instance',
        content: {
          'application/json': {
            schema: {
              title: 'newBookingTour',
              type: 'object',
              properties: {
                ...getModelSchemaRef(Booking, {title: 'detailBooking'}).definitions['detailBooking'].properties,
                tourReservation: getModelSchemaRef(TourReservation),
                currency: getModelSchemaRef(Currency),
                createdBy: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Users, {title: 'createdBy'}).definitions['createdBy'].properties,
                    relatedPageId: {
                      type: 'number',
                    },
                    profiles: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Profiles, {title: 'profile'}).definitions['profile'].properties,
                        avatars: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Avatars, {title: 'avatar'}).definitions['avatar'].properties,
                            mediaContent: getModelSchemaRef(MediaContents),
                          },
                        },
                      },
                    },
                  },
                },
                service: getModelSchemaRef(Service),
              },
            },
          },
        },
      },
    },
  })
  async cancelBooking(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'cancel booking',
            type: 'object',
            properties: {
              reasonCancelation: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    body: {reasonCancelation: string},
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Booking & BookingRelations> {
    return this.bookingHandler.cancelBooking(id, currentUser, body);
  }

  @patch('/bookings/tour/complete', {
    responses: {
      '204': {
        description: 'Booking PATCH complete success',
      },
    },
  })
  async completeTour(): Promise<void> {
    await this.bookingHandler.completeTour();
  }

  @patch('/bookings/stay/complete', {
    responses: {
      '204': {
        description: 'Booking PATCH complete success',
      },
    },
  })
  async completeStay(): Promise<void> {
    await this.bookingHandler.completeStay();
  }

  @patch('/bookings/tour/cancel', {
    responses: {
      '204': {
        description: 'Booking PATCH cancel success',
      },
    },
  })
  async cancelBookingTour(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'cancel booking',
            type: 'object',
            properties: {
              hours: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    body: {hours?: number},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    await this.bookingHandler.autoCancelAllBookingTourRequesting(body);
  }

  @patch('/bookings/stay/cancel', {
    responses: {
      '204': {
        description: 'Booking PATCH cancel success',
      },
    },
  })
  async cancelBookingStay(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'cancel booking',
            type: 'object',
            properties: {
              hours: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    body: {hours?: number},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    await this.bookingHandler.autoCancelAllBookingStayRequesting(body);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/bookings/stay', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Booking Stay model instance',
        content: {
          'application/json': {
            schema: {
              ...getModelSchemaRef(Booking),
            },
          },
        },
      },
    },
  })
  async createBookingStay(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'newBookingStay',
            type: 'object',
            properties: {
              ...getModelSchemaRef(StayReservation, {
                title: 'NewStayReservation',
                exclude: [
                  'id',
                  'reservationCode',
                  'userInfo',
                  'metadata',
                  'createdAt',
                  'updatedAt',
                  'deletedAt',
                  'stayId',
                  'otherUserInfo',
                  'bookingId',
                  'currencyId',
                ],
              }).definitions['NewStayReservation'].properties,
              userInfo: getModelSchemaRef(UserInfo),
              otherUserInfo: getModelSchemaRef(UserInfo),
              payMethod: {
                type: 'string',
                enum: [PayMethodEnum.postpaid],
              },
              serviceId: {
                type: 'number',
              },
            },
          },
        },
      },
    })
    bookingStayInput: BookingStayInput,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Booking> {
    return this.bookingHandler.createBookingStay(bookingStayInput, {
      currentUser,
    });
  }
}
