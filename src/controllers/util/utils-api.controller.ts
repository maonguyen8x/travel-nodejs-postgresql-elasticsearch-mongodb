// Uncomment these imports to begin using these cool features!
import {inject} from '@loopback/context';
import {AnyObject, Filter, repository} from '@loopback/repository';
import {get, getWhereSchemaFor, param} from '@loopback/rest';
import {get as getProperty} from 'lodash';
import {isEmpty} from 'lodash';
import {LocationStatusEnum, LocationTypesEnum} from '../../configs/location-constant';
import {POST_ACCESS_TYPE_PUBLIC, POST_TYPE_CREATED} from '../../configs/post-constants';
import {Locations} from '../../models';
import {
  ActivityRepository,
  ConversationRepository,
  LocationsRepository,
  MediaContentsRepository,
  PageRepository,
  PageReviewRepository,
  PostsRepository,
  RankingsRepository,
  StayOffDayRepository,
  UsersRepository,
  ServiceReviewRepository,
} from '../../repositories';
import {changeAlias, parseOrderToElasticSort, parseStringToGeo} from '../../utils/handleString';
import {
  HomeResultDataInterface,
  HomeResultDataTourInterface,
  HomeSearchInterface,
  PriceCurrencyInterface,
} from './util-interface';
import {sortByList} from '../../utils/Array';
import {MessagesHandlerController, PostLogicController} from '..';
import {handleError} from '../../utils/handleError';
import {RANKING_ACCESS_TYPE_ACCEPTED} from '../../configs/ranking-constant';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {PageHandler} from '../pages/page.handler';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {asyncLimiter} from '../../utils/Async-limiter';
import moment from 'moment';
import {ServiceHandler} from '../services/service.handler';
import {ELASTICwhereToMatchs} from '../../configs/utils-constant';
import {BookingHandler} from '../booking/booking.handler';
import _ = require('lodash');
import {schemaHome, schemaStay, schemaTour, schemaActivity} from './util.schema';
import {ActivityHandler} from '../activities/activity.handler';

export class UtilsApiController {
  constructor(
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(ConversationRepository)
    public conversationRepository: ConversationRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @inject('controllers.MessagesHandlerController')
    public messagesHandlerController: MessagesHandlerController,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @inject(HandlerBindingKeys.PAGE_HANDLER) public pageHandler: PageHandler,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
    @repository(ActivityRepository)
    public activityRepository: ActivityRepository,
    @inject(HandlerBindingKeys.ACTIVITIES_HANDLER)
    public activityHandler: ActivityHandler,
    @inject(HandlerBindingKeys.SERVICE_HANDLER)
    public serviceHandler: ServiceHandler,
    @repository(ServiceReviewRepository)
    public serviceReviewRepository: ServiceReviewRepository,
    @inject(HandlerBindingKeys.BOOKING_HANDLER)
    public bookingHandler: BookingHandler,
    @repository(StayOffDayRepository)
    public stayOffDayRepository: StayOffDayRepository,
    @repository(PageReviewRepository)
    public pageReviewRepository: PageReviewRepository,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/home', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Locations model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                where: schemaHome,
                food: schemaHome,
                stay: schemaStay,
                tour: schemaTour,
                activity: schemaActivity,
              },
            },
          },
        },
      },
    },
  })
  async home(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'homeSearch',
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
    homeSearch?: HomeSearchInterface,
  ): Promise<{
    where: {
      count: number;
      data: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[];
    };
    food: {
      count: number;
      data: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[];
    };
    // stay: {count: number, data: ((HomeResultDataInterface | null) | (LocationStayInterface | null))[]},
    tour: {
      count: number;
      data: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[];
    };
    activity: {
      count: number;
      data: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[];
    };
  }> {
    const userId = parseInt(userProfile[securityId]);
    const filter: Filter<Locations> = {
      offset: homeSearch?.offset,
      limit: homeSearch?.limit,
      where: homeSearch?.where,
      order: homeSearch?.order,
    };

    const [
      where,
      food,
      // stay,
      tour,
      activity,
    ] = await Promise.all([
      this.getLocations({
        type: LocationTypesEnum.where,
        filter,
        q: homeSearch?.q,
        coordinates: homeSearch?.coordinates,
        distance: homeSearch?.distance,
        userId,
      }),
      this.getLocations({
        type: LocationTypesEnum.food,
        filter,
        q: homeSearch?.q,
        coordinates: homeSearch?.coordinates,
        distance: homeSearch?.distance,
        userId,
      }),
      // this.handleGenerateStay(
      //   {
      //     filter: {
      //       offset: homeSearch?.offset,
      //       limit: homeSearch?.limit,
      //     },
      //     q: homeSearch?.q,
      //     coordinates: homeSearch?.coordinates,
      //     distance: homeSearch?.distance,
      //     userId,
      //     checkinDate: dayjs().utc().toISOString(),
      //     checkoutDate: dayjs().utc().add(1,'d').toISOString(),
      //   }
      // ),
      this.getLocations({
        type: LocationTypesEnum.tour,
        filter,
        q: homeSearch?.q,
        coordinates: homeSearch?.coordinates,
        distance: homeSearch?.distance,
        userId,
      }),
      this.getActivities({
        filter,
        q: homeSearch?.q,
        coordinates: homeSearch?.coordinates,
        distance: homeSearch?.distance,
      }),
    ]);

    return {
      where,
      food,
      // stay,
      tour,
      activity,
    };
  }

  async search(
    filter: Filter<Locations>,
    q?: string,
    coordinates?: string,
    distance?: number,
    locationType?: any,
  ): Promise<AnyObject> {
    const where = {
      ...filter?.where,
    };
    const matchs = ELASTICwhereToMatchs(where);
    const must: AnyObject[] = [...matchs];

    if (locationType === LocationTypesEnum.where || locationType?.inq?.includes(LocationTypesEnum.where)) {
      must.push({
        range: {
          totalReview: {
            gte: 1,
          },
        },
      });
    }

    if (locationType === LocationTypesEnum.food || locationType?.inq?.includes(LocationTypesEnum.food)) {
      must.push({
        match: {
          isPublished: true,
        },
      });
    }

    // search with city, country
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['country', 'areaLevel1'],
        },
      });
    }

    const body: AnyObject = {
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      sort: [
        ...parseOrderToElasticSort(filter?.order || ['']),
        ...(q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
      ],
      query: {
        bool: {
          must: must,
          must_not: [
            {
              match: {
                status: LocationStatusEnum.draft,
              },
            },
          ],
        },
      },
    };

    if (coordinates) {
      body.sort = locationType !== LocationTypesEnum.activity && [
        {
          _geo_distance: {
            coordinates: coordinates,
            order: 'asc',
            unit: 'km',
          },
        },
      ];

      body.script_fields = {
        distance: {
          script: {
            params: parseStringToGeo(coordinates),
            source: "doc['coordinates'].arcDistance(params.lat,params.lon)",
          },
        },
      };

      body.stored_fields = ['_source'];
      if (distance) {
        body.query.bool = {
          ...body.query.bool,
          filter: {
            geo_distance: {
              distance: `${distance}m`,
              coordinates: coordinates,
            },
          },
        };
      }
    }

    const result = await this.locationsRepository.elasticService.get(body);
    if (!isEmpty(result)) {
      return result;
    }
    return {};
  }

  async getLocations({
    type,
    filter,
    q,
    coordinates,
    distance,
    userId,
  }: {
    type: string;
    filter: Filter<Locations>;
    q?: string;
    coordinates?: string;
    distance?: number;
    userId?: number;
  }): Promise<{
    count: number;
    data: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[];
  }> {

    let result: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[] = [];
    let count = 0;
    const searchResult = await this.search(
      {
        ...filter,
        where: {
          ...filter.where,
          locationType: type,
        },
      },
      q,
      coordinates,
      distance,
      type,
    );
    if (!isEmpty(searchResult)) {
      count = getProperty(searchResult, 'body.hits.total.value', 0);
      const hits = getProperty(searchResult, 'body.hits.hits', []);
      const getIdsFromHits = (item: {
        _source: {
          id: number;
        };
      }) => {
        if (item) {
          return item._source.id;
        }
      };
      const listIds = hits.map(getIdsFromHits);
      let data: any = [];
      data = await this.locationsRepository.find({
        order: ['averagePoint DESC'],
        where: {
          id: {
            inq: listIds,
          },
        },
        include: [
          {
            relation: 'interestings',
            scope: {
              where: {
                userId,
              },
            },
          },
        ],
      });
      const getLocation = {
        [String(LocationTypesEnum.where)]: async () => {
          return asyncLimiter(data.map((item: any) => this.getLocationDataWhere(item, userId)));
        },
        [String(LocationTypesEnum.tour)]: async () => {
          return asyncLimiter(data.map((item: any) => this.getLocationDataTour(item, userId)));
        },
        // [String(LocationTypesEnum.stay)]: async () => {
        //   return asyncLimiter(data.map(item => this.getLocationDataStay(item, userId)))
        // },
        [String(LocationTypesEnum.food)]: async () => {
          return asyncLimiter(data.map((item: any) => this.getLocationDataFood(item, userId)));
        },
      };
      result = await getLocation[String(type)]();
      result = sortByList(result, 'id', listIds);
    }

    return {
      data: result,
      count: count,
    };
  }

  async getActivities({
    filter,
    q,
    coordinates,
    distance,
  }: {
    filter: Filter<Locations>;
    q?: string;
    coordinates?: string;
    distance?: number;
  }): Promise<{
    count: number;
    data: ((HomeResultDataInterface | null) | (HomeResultDataTourInterface | null))[];
  }> {

    const where = {
      ...filter?.where,
    };
    const matchs = ELASTICwhereToMatchs(where);
    const must: AnyObject[] = [...matchs];

    must.push({
      bool: {
        should: [
          {
            range: {
              from: {
                gte: moment().startOf('day').toISOString(),
              },
            },
          },
          {
            range: {
              to: {
                gte: moment().startOf('day').toISOString(),
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    });

    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['country', 'areaLevel1'],
        },
      });
    }

    const body: AnyObject = {
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      sort: [
        {
          participantNumber: {
            order: 'desc',
          },
        },
      ],
      query: {
        bool: {
          must: must,
        },
      },
    };

    if (coordinates) {
      body.script_fields = {
        distance: {
          script: {
            params: parseStringToGeo(coordinates),
            source: "doc['coordinates'].arcDistance(params.lat,params.lon)",
          },
        },
      };

      body.stored_fields = ['_source'];
      if (distance) {
        body.query.bool = {
          ...body.query.bool,
          filter: {
            geo_distance: {
              distance: `${distance}m`,
              coordinates: coordinates,
            },
          },
        };
      }
    }

    const searchResult = await this.activityRepository.elasticService.get(body);

    if (!isEmpty(searchResult)) {
      const count = getProperty(searchResult, 'body.hits.total.value', 0);
      const hits = getProperty(searchResult, 'body.hits.hits', []);

      const getIdsFromHits = (item: {
        _source: {
          id: number;
        };
      }) => {
        if (item) {
          return item._source.id;
        }
      };
      const listIds = hits.map(getIdsFromHits);

      const activities = await this.activityRepository.find({
        where: {
          id: {
            inq: listIds,
          },
        },
        include: [
          {
            relation: 'currency',
          },
          {
            relation: 'location',
          },
          {
            relation: 'post',
            scope: {
              include: [
                {
                  relation: 'mediaContents',
                },
              ],
            },
          },
        ],
      });
      const result = await asyncLimiter(
        activities.map((activity: any) => {
          try {
            return {
              ...activity.location,
              name: activity.name,
              activity: activity,
              activityId: activity.id,
              post: activity?.post,
              type: LocationTypesEnum.activity,
              attachments: {
                mediaContents: activity?.post?.mediaContents || [],
              },
            };
          } catch (e) {
            return handleError(e);
          }
        }),
      );

      const data = sortByList(result, 'activityId', listIds);
      return {
        data,
        count: count,
      };
    }
    return {
      data: [],
      count: 0,
    };
  }

  async getLocationDataFood(location: Locations, userId?: number): Promise<HomeResultDataInterface | AnyObject> {
    const [page, isSavedLocation] = await Promise.all([
      this.pageRepository.findOne({
        where: {
          locationId: location.id,
        },
        include: [
          {
            relation: 'background',
            scope: {
              limit: 1,
              fields: {
                id: true,
                url: true,
                urlBlur: true,
                urlTiny: true,
                urlOptimize: true,
                urlBackground: true,
                resourceType: true,
                userId: true,
              },
            },
          },
        ],
      }),
      this.postLogicController.checkLocationHadSaveToMyMap({
        locationId: location.id || 0,
        userId: userId || 0,
      }),
    ]);
    const [dataPageReview, pageFoodPrice] = await Promise.all([
      this.pageReviewRepository.find({
        where: {
          pageId: page?.id,
        },
      }),
      this.getMinMaxPriceFood(page?.id || 0),
    ]);
    return {
      ...location,
      pageId: page?.id,
      isSavedLocation,
      attachments: {
        mediaContents: [page?.background] || [],
      },
      pageFoodGeneralInformation: page?.generalInformation?.food,
      pageFoodPrice: {
        minPrice: pageFoodPrice.minPrice,
        maxPrice: pageFoodPrice.maxPrice,
      },
      pageFoodReview: {
        totalReview: dataPageReview.length,
        averagePoint: dataPageReview.length ? Math.round(_.sumBy(dataPageReview, 'point') / dataPageReview.length) : 0,
      },
      hadInteresting: Boolean(location?.interestings?.length),
      ...(location?.interestings?.length ? {interesting: location?.interestings[0]} : {}),
    };
  }

  async getLocationDataWhere(location: Locations, userId?: number): Promise<HomeResultDataInterface | AnyObject> {
    const [coverPost, totalRanking, isSavedLocation] = await Promise.all([
      this.postsRepository.findOne({
        where: {
          locationId: location.id,
          isPublicLocation: true,
          postType: POST_TYPE_CREATED,
          accessType: POST_ACCESS_TYPE_PUBLIC,
        },
        order: ['averagePoint DESC'],
        include: [
          {
            relation: 'mediaContents',
            scope: {
              limit: 1,
              fields: {
                id: true,
                url: true,
                urlBlur: true,
                urlTiny: true,
                urlOptimize: true,
                urlBackground: true,
                resourceType: true,
                postId: true,
              },
            },
          },
        ],
      }),
      this.rankingsRepository.count({
        locationId: location.id,
        rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
      }),
      this.postLogicController.checkLocationHadSaveToMyMap({
        locationId: location.id || 0,
        userId: userId || 0,
      }),
    ]);
    return {
      ...location,
      isSavedLocation,
      attachments: {
        mediaContents: coverPost?.mediaContents || [],
      },
      totalRanking: totalRanking?.count,
      hadInteresting: Boolean(location?.interestings?.length),
      ...(location?.interestings?.length ? {interesting: location?.interestings[0]} : {}),
    };
  }

  async getLocationDataTour(location: Locations, userId?: number): Promise<HomeResultDataTourInterface> {
    try {
      const tour = await this.serviceHandler.tourRepository.findOne({
        include: [
          {
            relation: 'timeToOrganizeTours',
            scope: {
              where: {
                deletedAt: null,
              },
            },
          },
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'currency',
                },
                {
                  relation: 'post',
                  scope: {
                    include: [
                      {
                        relation: 'mediaContents',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'location',
            scope: {
              include: [
                {
                  relation: 'interestings',
                  scope: {
                    where: {
                      userId,
                    },
                  },
                },
                {
                  relation: 'myLocations',
                  scope: {
                    where: {
                      userId,
                    },
                  },
                },
              ],
            },
          },
        ],
        where: {
          locationId: location?.id,
        },
      });
      return {
        ...tour?.location,
        ...(location?.interestings?.length ? {interesting: location?.interestings[0]} : {}),
        totalRanking: tour?.location?.totalReview || 0,
        hadInteresting: Boolean(location?.interestings?.length),
        isSavedLocation: Boolean(tour?.location?.myLocations?.length),
        name: tour?.service?.name,
        pageId: tour?.service?.pageId,
        serviceId: tour?.service?.id,
        attachments: {
          mediaContents: tour?.service?.post?.mediaContents || [],
        },
        tour: {
          id: tour?.id,
          currency: tour?.service?.currency,
          currencyId: tour?.service?.currencyId,
          tourName: tour?.service?.name,
          price: tour?.service?.price,
          destinations: tour?.destinations,
          totalTourTime: tour?.totalTourTime,
          timeToOrganizeTour: tour?.timeToOrganizeTours,
          isDailyTour: tour?.isDailyTour,
          dateOff: tour?.dateOff,
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async getMinMaxPriceFood(
    pageId: number,
  ): Promise<{
    minPrice: PriceCurrencyInterface;
    maxPrice: PriceCurrencyInterface;
  }> {
    const [minPriceService, maxPriceService] = await Promise.all([
      this.serviceHandler.serviceRepository.findOne({
        where: {
          pageId,
        },
        include: [
          {
            relation: 'currency',
          },
        ],
        order: ['price ASC'],
      }),
      this.serviceHandler.serviceRepository.findOne({
        where: {
          pageId,
        },
        include: [
          {
            relation: 'currency',
          },
        ],
        order: ['price DESC'],
      }),
    ]);
    return {
      minPrice: {
        value: minPriceService?.price || 0,
        currency: minPriceService?.currency,
      },
      maxPrice: {
        value: maxPriceService?.price || 0,
        currency: maxPriceService?.currency,
      },
    };
  }

  @get('/init-data-conversation', {
    responses: {
      '200': {
        description: 'Array of Locations model instances',
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
  async initDataConversation(): Promise<{
    message: string;
  }> {
    try {
      const listConversation = await this.conversationRepository.find();
      for (const item of listConversation) {
        await this.messagesHandlerController.handleUpdateDataConverationToElasticSearch(item);
      }
      return {
        message: 'init data conversation successful',
      };
    } catch (error) {
      return {
        message: 'init data conversation fail',
      };
    }
  }

  // async handleGenerateStay({
  //   where,
  //   q,
  //   filter,
  //   userId,
  //   coordinates,
  //   distance,
  //   checkinDate,
  //   checkoutDate,
  // }: {
  //   where?: Where<ModelFilterStayClass>;
  //   q?: string;
  //   filter?: Filter<Service>;
  //   userId?: number;
  //   coordinates?: string;
  //   distance?: number;
  //   checkinDate?: string;
  //   checkoutDate?: string;
  // }): Promise<{
  //   count: number;
  //   data: LocationStayInterface[];
  // }> {
  //   const result = this.getLocations({
  //     type: LocationTypesEnum.stay,
  //     filter: {},
  //     coordinates: coordinates,
  //     distance: distance,
  //     userId,
  //   });
  //   const listPageId = (await result).data.map((item) => item?.page?.id);
  //   return this.serviceHandler.handleSearchStay({
  //     where,
  //     q,
  //     filter,
  //     userId,
  //     coordinates,
  //     distance,
  //     checkinDate,
  //     checkoutDate,
  //     listPageId,
  //   });
  // }

  // async getLocationDataStay(location: Locations, userId?: number): Promise<LocationStayInterface> {
  //   try {
  //     const page = await this.pageRepository.findOne({
  //       where: {
  //         locationId: location.id,
  //       },
  //     });
  //
  //     const [service, interesting] = await Promise.all([
  //       this.serviceHandler.serviceRepository.findOne({
  //         where: {
  //           pageId: getProperty(page, 'id', 0),
  //         },
  //         order: ['price ASC'],
  //         include: [
  //           {
  //             relation: 'currency',
  //           },
  //           {
  //             relation: 'post',
  //             scope: {
  //               include: [
  //                 {
  //                   relation: 'mediaContents',
  //                 },
  //               ],
  //             },
  //           },
  //           {
  //             relation: 'stay',
  //             scope: {
  //               include: [
  //                 {
  //                   relation: 'accommodationType',
  //                 },
  //               ],
  //             },
  //           },
  //         ],
  //       }),
  //       this.rankingsRepository.findOne({
  //         where: {
  //           locationId: location.id,
  //           userId,
  //         },
  //       }),
  //     ]);
  //
  //     return {
  //       ...location,
  //       // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //       // @ts-ignore
  //       page,
  //       name: getProperty(page, 'name'),
  //       service,
  //       pageId: getProperty(page, 'id'),
  //       serviceId: service?.id,
  //       ...(getProperty(service, 'stay')
  //         ? {
  //           stay: getProperty(service, 'stay'),
  //         }
  //         : {}),
  //       hadInteresting: Boolean(interesting),
  //       attachments: {
  //         mediaContents: getProperty(service, ['post', 'mediaContents'], []),
  //       },
  //     };
  //   } catch (e) {
  //     return handleError(e);
  //   }
  // }
  //
  // @get('/init-service-stay', {
  //   responses: {
  //     '200': {
  //       description: 'stay',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               message: {
  //                 type: 'string',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async initServiceStay(): Promise<{
  //   message: string;
  // }> {
  //   try {
  //     const [service, serviceDelete] = await Promise.all([
  //       this.serviceHandler.serviceRepository.find({
  //         where: {
  //           type: 'STAY',
  //           deletedAt: {
  //             eq: null,
  //           },
  //         },
  //         include: [
  //           {
  //             relation: 'stay',
  //           },
  //         ],
  //       }),
  //       this.serviceHandler.serviceRepository.findDelete({
  //         where: {
  //           type: 'STAY',
  //           deletedAt: {
  //             neq: null,
  //           },
  //         },
  //       }),
  //     ]);
  //     for (const item of service) {
  //       await this.serviceHandler.serviceRepository.updateById(item.id, {
  //         name: item.name || getProperty(item, ['stay', 'name']),
  //       });
  //       await this.handleUpdateDayOffStay(item.id || 0);
  //     }
  //     for (const item of service) {
  //       await this.serviceHandler.handleUpdateStayElasticSearch(item.id || 0);
  //     }
  //     for (const item of service) {
  //       await this.bookingHandler.handleUpdateBookingStay(item.id || 0);
  //     }
  //     for (const item of serviceDelete) {
  //       // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //       this.serviceHandler.stayRepository.elasticService.deleteById(item.id);
  //     }
  //     return {
  //       message: 'init data stay successful',
  //     };
  //   } catch (error) {
  //     return {
  //       message: 'init data stay fail',
  //     };
  //   }
  // }

  // @get('/migrate-page', {
  //   responses: {
  //     '200': {
  //       description: 'migrate-page',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               message: {
  //                 type: 'string',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async migratePage(): Promise<{
  //   message: string;
  // }> {
  //   const pages = await this.pageRepository.find();
  //   const pageFood = await this.locationsRepository.find({
  //     where: {
  //       locationType: LocationTypesEnum.food,
  //     },
  //   });
  //   for (const item of pageFood) {
  //     await this.locationsRepository.updateById(item.id, {
  //       status: LocationStatusEnum.public,
  //     });
  //   }
  //   await Promise.all(pages.map((item) => this.handleMigratePageBackground(item)));
  //
  //   return {
  //     message: 'init successful',
  //   };
  // }

  // async handleMigratePageBackground(page: Partial<Page>): Promise<void> {
  //   const pageData = {
  //     backgroundId: page.backgroundId || 0,
  //     avatarId: page.avatarId || 0,
  //     name: page.name || '',
  //   };
  //   if (!page.backgroundId) {
  //     const mediaType = BgDefaultPage[`${page.type}`];
  //     const background = await this.mediaContentsRepository.findOne({
  //       where: {
  //         mediaType,
  //       },
  //       order: ['createdAt DESC', 'updatedAt DESC'],
  //     });
  //     if (background?.id) {
  //       pageData.backgroundId = background?.id;
  //     }
  //   }
  //   if (!pageData.avatarId) {
  //     const mediaType = AvatarDefaultPage[`${page.type}`];
  //     const avatar = await this.mediaContentsRepository.findOne({
  //       where: {
  //         mediaType,
  //       },
  //       order: ['createdAt DESC', 'updatedAt DESC'],
  //     });
  //     if (avatar?.id) {
  //       pageData.avatarId = avatar?.id;
  //     }
  //   }
  //   await this.pageHandler.updateById(page?.id || 0, pageData, page?.userId || 0);
  // }

  // async handleUpdateDayOffStay(serviceId: number): Promise<void> {
  //   const now = dayjs().utc().toISOString();
  //   const stayDayOff = await this.stayOffDayRepository.find({
  //     where: {
  //       serviceId,
  //       date: {
  //         gte: now,
  //       },
  //     },
  //   });
  //   await this.serviceHandler.stayRepository.elasticService.updateById(
  //     {
  //       dayOffs: stayDayOff.map((item) => {
  //         return {
  //           startDate: dayjs(item.date).startOf('d'),
  //           endDate: dayjs(item.date).endOf('d'),
  //         };
  //       }),
  //     },
  //     serviceId,
  //   );
  // }
}
