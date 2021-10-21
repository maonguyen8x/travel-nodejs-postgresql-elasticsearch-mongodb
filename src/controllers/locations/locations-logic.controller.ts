// Uncomment these imports to begin using these cool features!

import {AnyObject, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {Activity, Locations, Posts, PostsWithRelations} from '../../models';
import {
  ActivityBookmarkRepository,
  ActivityParticipantRepository,
  ActivityRepository,
  LocationsRepository,
  MyLocationsRepository,
  PageRepository,
  PageReviewRepository,
  PostsRepository,
  RankingsRepository,
  ServiceRepository,
  TourRepository,
} from '../../repositories';
import {changeAlias, parseStringToGeo, parseOrderToElasticSort} from '../../utils/handleString';
import {POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import _, {get as path, isEmpty, omit} from 'lodash';
import {
  HandleSearchResultInterface,
  IActivitySearchInput,
  ITourSearchInput,
  PriceCurrencyInterface,
} from './location-interface';
import {LocationStatusEnum, LocationTypesEnum} from '../../configs/location-constant';
import {ServiceTypes} from '../../configs/page-constant';
import {sortByList} from '../../utils/Array';
import {handleError} from '../../utils/handleError';
import {get as getProperty, get, has} from 'lodash';
import {RANKING_ACCESS_TYPE_ACCEPTED} from '../../configs/ranking-constant';
import {LocationActivityInterface, LocationStayInterface} from '../util/util-interface';
import {ActivityDetailResponseInterface, participantStatusEnum} from '../activities/activity.constant';
import {PostDataWithFlagInterface} from '../posts/post.contant';
import {userInfoQuery} from '../specs/user-controller.specs';
import {ELASTICwhereToMatchs} from '../../configs/utils-constant';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {BookmarkLocationHandler} from '../bookmark-location/bookmark-location.handler';
import moment from 'moment';
import {
  SEARCH_TYPE_ACTIVITY_LOCATION,
  SEARCH_TYPE_ALL_LOCATION,
  SEARCH_TYPE_NEARBY_LOCATION,
} from './locations.constant';

export class LocationsLogicController {
  constructor(
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(TourRepository)
    public tourRepository: TourRepository,
    @repository(ServiceRepository)
    public serviceRepository: ServiceRepository,
    @repository(ActivityRepository)
    public activityRepository: ActivityRepository,
    @repository(ActivityParticipantRepository)
    public activityParticipantRepository: ActivityParticipantRepository,
    @repository(ActivityBookmarkRepository)
    public activityBookmarkRepository: ActivityBookmarkRepository,
    @repository(MyLocationsRepository)
    public myLocationsRepository: MyLocationsRepository,
    @repository(PageReviewRepository)
    public pageReviewRepository: PageReviewRepository,
    @inject(HandlerBindingKeys.BOOKMARK_LOCATION_HANDLER)
    public bookmarkLocationHandler: BookmarkLocationHandler,
  ) {}

  async create(locations: AnyObject): Promise<Locations> {
    try {
      const result = await this.locationsRepository.create({
        ...locations,
        userId: locations.userId,
      });
      await Promise.all([
        this.locationsRepository.updateIsDuplicateInLocation(locations),
        this.bookmarkLocationHandler.create({
          locationId: result?.id || 0,
          userId: result.userId,
        }),
      ]);
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async find(
    filter?: Filter<Locations>,
  ): Promise<{
    count: number;
    data: HandleSearchResultInterface[];
  }> {
    try {
      const where: Where<Locations> = {
        ...(!getProperty(filter, 'where.locationType')
          ? {
              or: [
                {
                  ...filter?.where,
                  locationType: LocationTypesEnum.where,
                  totalReview: {
                    gte: 1,
                  },
                  status: LocationStatusEnum.public,
                },
                {
                  locationType: {
                    nin: [LocationTypesEnum.where, LocationTypesEnum.other],
                  },
                  status: LocationStatusEnum.public,
                },
              ],
            }
          : {
              ...filter?.where,
              ...(getProperty(filter, 'where.locationType') === LocationTypesEnum.where
                ? {
                    totalReview: {
                      gte: 1,
                    },
                    status: LocationStatusEnum.public,
                  }
                : {
                    status: LocationStatusEnum.public,
                  }),
            }),
      };
      const count = await this.locationsRepository.count({
        ...where,
      });
      const data = await this.locationsRepository.find({
        ...filter,
        where: where,
        include: [
          {
            relation: 'interestings',
          },
        ],
      });
      const result = await Promise.all(
        data.map((item) => {
          return this.handleSearchResult(item);
        }),
      );
      return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        data: result.filter((item) => item),
        count: count.count,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async elkSearch(filter: Filter<Locations>, q?: string): Promise<AnyObject> {
    const where = {
      ...(filter?.where || {}),
    };
    const sort: AnyObject[] = [];
    const musts = ELASTICwhereToMatchs(where);
    const must: AnyObject[] = [...musts];
    const locationType = path(where, ['locationType']);
    if (!locationType || !has(locationType, 'inq')) {
      must.push(this.generateMustContidionIsFull());
    }
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['name', 'formatedAddress'],
        },
      });
    }
    const body: AnyObject = {
      _source: {
        includes: ['id', 'originalName', 'originalAddress', 'originalCountry', 'originalAreaLevel1', 'coordinates'],
      },
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
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: must,
          must_not: [],
        },
      },
    };
    const result = await this.locationsRepository.elasticService.get(body);
    if (!isEmpty(result)) {
      return result;
    }
    return {};
  }

  async search(
    filter: Filter<Locations>,
    q?: string,
    coordinates?: string,
    distance?: number,
    mode = 'NORMAL',
    filterActivity?: IActivitySearchInput,
    filterTour?: ITourSearchInput,
    searchType?: string,
  ): Promise<AnyObject> {
    const where =
      {
        ...filter?.where,
        ...(filterActivity?.where && has(filterActivity?.where, 'price')
          ? {
              price: get(filterActivity?.where || {}, 'price'),
            }
          : {}),
        ...(filterTour?.where && has(filterTour?.where, 'totalTourTime.day')
          ? {
              'totalTourTime.day': get(filterTour?.where || {}, 'totalTourTime.day'),
            }
          : {}),
        ...(filterTour?.where && has(filterTour?.where, 'totalTourTime.night')
          ? {
              'totalTourTime.night': get(filterTour?.where || {}, 'totalTourTime.night'),
            }
          : {}),
      } || {};
    const sort: AnyObject[] = [];
    const musts = ELASTICwhereToMatchs(where);
    const must: AnyObject[] = [...musts];
    const locationType = path(where, ['locationType']);
    if (!locationType) {
      if (mode === 'NORMAL') {
        must.push(this.generateMustContidion());
      } else {
        must.push(this.generateMustContidionIsFull());
      }
    } else {
      if (has(locationType, 'inq')) {
        if (mode === 'NORMAL') {
          const should: AnyObject[] = [];
          _.map(locationType['inq'], (value: string | number) => {
            if (value === LocationTypesEnum.where) {
              should.push({
                bool: {
                  must: [
                    {
                      match: {
                        locationType: value,
                      },
                    },
                    {
                      range: {
                        totalReview: {
                          gte: 1,
                        },
                      },
                    },
                  ],
                },
              });
            } else if (value === LocationTypesEnum.food) {
              should.push({
                bool: {
                  must: [
                    {
                      match: {
                        locationType: value,
                      },
                    },
                    {
                      match: {
                        isPublished: true,
                      },
                    },
                  ],
                },
              });
            } else {
              // do some thing other location type
              should.push({
                bool: {
                  must: [
                    {
                      match: {
                        locationType: value,
                      },
                    },
                  ],
                },
              });
            }
            must.push({
              bool: {
                should: should,
              },
            });
          });
        } else {
          const should: AnyObject[] = [];
          _.map(locationType['inq'], (value: string | number) => {
            if (value === LocationTypesEnum.where || value === LocationTypesEnum.food) {
              should.push({
                bool: {
                  must: [
                    {
                      match: {
                        locationType: value,
                      },
                    },
                    {
                      match: {
                        isPublished: true,
                      },
                    },
                  ],
                },
              });
            } else {
              // do some thing other location type
              should.push({
                bool: {
                  must: [
                    {
                      match: {
                        locationType: value,
                      },
                    },
                  ],
                },
              });
            }
          });
          must.push({
            bool: {
              should: should,
            },
          });
        }
      } else {
        if (mode === 'NORMAL') {
          if (locationType === LocationTypesEnum.where) {
            must.push({
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          match: {
                            locationType: locationType,
                          },
                        },
                        {
                          range: {
                            totalReview: {
                              gte: 1,
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            });
          } else if (locationType === LocationTypesEnum.food) {
            must.push({
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          match: {
                            locationType: locationType,
                          },
                        },
                        {
                          match: {
                            isPublished: true,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            });
          } else {
            // do some thing other location type
            must.push({
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          match: {
                            locationType: locationType,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            });
          }
        } else {
          if (locationType === LocationTypesEnum.where || locationType === LocationTypesEnum.food) {
            must.push({
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          match: {
                            locationType: locationType,
                          },
                        },
                        {
                          match: {
                            isPublished: true,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            });
          } else {
            // do some thing other location type
            must.push({
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          match: {
                            locationType: locationType,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            });
          }
        }
      }
    }
    if (filterActivity?.dateSearch) {
      must.push({
        bool: {
          should: [
            {
              range: {
                from: {
                  gte: moment(filterActivity.dateSearch).startOf('day').toISOString(),
                },
              },
            },
            {
              range: {
                to: {
                  gte: moment(filterActivity.dateSearch).startOf('day').toISOString(),
                },
              },
            },
          ],
          minimum_should_match: 1,
        },
      });
    }
    if (filterTour?.startDay) {
      must.push({
        bool: {
          should: [
            {
              range: {
                'timeToOrganizeTour.startDate': {
                  gte: moment(filterTour.startDay).startOf('day').toISOString(),
                  lte: moment(filterTour.startDay).endOf('day').toISOString(),
                },
              },
            },
            {
              match: {
                isDailyTour: true,
              },
            },
          ],
          must_not: [
            {
              match: {
                'dateOff.value': moment(filterTour.startDay).format('YYYY-MM-DD'),
              },
            },
          ],
          minimum_should_match: 1,
        },
      });
    }
    if (q?.length) {
      if (
        searchType?.length &&
        (searchType === SEARCH_TYPE_NEARBY_LOCATION ||
          searchType === SEARCH_TYPE_ACTIVITY_LOCATION ||
          searchType === SEARCH_TYPE_ALL_LOCATION)
      ) {
        must.push({
          multi_match: {
            query: changeAlias(q).trim(),
            operator: 'and',
            fields: ['name', 'formatedAddress'],
          },
        });
      } else {
        must.push({
          multi_match: {
            query: changeAlias(q).trim(),
            operator: 'and',
            fields: ['country', 'areaLevel1'],
          },
        });
      }
    }
    const body: AnyObject = {
      sort: [
        locationType === LocationTypesEnum.activity
          ? {
              totalParticipant: {
                order: 'desc',
              },
            }
          : {},
        ...(q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
        ...sort,
        ...parseOrderToElasticSort(filter?.order || ['']),
      ],
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: must,
          must_not: [
            {
              match: {
                locationType: LocationTypesEnum.other,
              },
            },
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

  generateMustContidion(): AnyObject {
    const should: AnyObject[] = [];
    // push location type service
    ServiceTypes.map((item) => {
      should.push({
        match: {
          locationType: item,
        },
      });
    });
    // push location type google
    should.push({
      bool: {
        must: [
          {
            match: {
              locationType: LocationTypesEnum.google.toString(),
            },
          },
        ],
      },
    });
    // push location type where
    should.push({
      bool: {
        must: [
          {
            match: {
              locationType: LocationTypesEnum.where.toString(),
            },
          },
          {
            range: {
              totalReview: {
                gte: 1,
              },
            },
          },
        ],
      },
    });
    // push location type food
    should.push({
      bool: {
        must: [
          {
            match: {
              locationType: LocationTypesEnum.food.toString(),
            },
          },
          {
            match: {
              isPublished: true,
            },
          },
        ],
      },
    });
    return {
      bool: {
        should,
      },
    };
  }

  generateMustContidionIsFull(): AnyObject {
    const should: AnyObject[] = [];
    // push location type service
    ServiceTypes.map((item) => {
      should.push({
        match: {
          locationType: item,
        },
      });
    });
    // push location type google
    should.push({
      bool: {
        must: [
          {
            match: {
              locationType: LocationTypesEnum.google.toString(),
            },
          },
        ],
      },
    });
    // push location type where
    should.push({
      bool: {
        must: [
          {
            match: {
              locationType: LocationTypesEnum.where.toString(),
            },
          },
          {
            match: {
              isPublished: true,
            },
          },
        ],
      },
    });
    // push location type food
    should.push({
      bool: {
        must: [
          {
            match: {
              locationType: LocationTypesEnum.food.toString(),
            },
          },
          {
            match: {
              isPublished: true,
            },
          },
        ],
      },
    });
    return {
      bool: {
        should,
      },
    };
  }

  async renderLocationFromGoogle(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    try {
      return {
        ...omit(location, ['tour']),
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async renderMediaFromPost(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    const [coverPost, ranking, isSavedLocation, totalPosts] = await Promise.all([
      this.postsRepository.findOne({
        where: {
          accessType: POST_ACCESS_TYPE_PUBLIC,
          locationId: location.id,
          isPublicLocation: true,
        },
        include: [
          {
            relation: 'mediaContents',
          },
        ],
      }),
      this.rankingsRepository.findOne({
        where: {
          locationId: location.id,
          userId,
        },
      }),
      this.myLocationsRepository.findOne({
        where: {
          locationId: get(location, 'id', 0),
          userId,
        },
      }),
      this.postsRepository.count({
        accessType: POST_ACCESS_TYPE_PUBLIC,
        locationId: location.id,
        isPublicLocation: true,
      }),
    ]);
    return {
      ...omit(location, ['tour']),
      totalPosts: totalPosts?.count || 0,
      isSavedLocation: Boolean(isSavedLocation),
      hadInteresting: Boolean(location?.interestings?.length),
      ...(location?.interestings?.length
        ? {
            interesting: location?.interestings[0],
          }
        : {}),
      attachments: {
        mediaContents: coverPost?.mediaContents || [],
      },
      ranking,
    };
  }

  async renderMediaInTour(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    try {
      const tour = await this.tourRepository.findOne({
        include: [
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
        ...(tour?.location?.interestings?.length && {
          interesting: tour?.location?.interestings[0],
        }),
        hadInteresting: Boolean(tour?.location?.interestings?.length),
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
          totalRanking: tour?.location?.totalReview || 0,
          vehicleServices: tour?.vehicleServices?.map((item) => item.value),
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async renderMediaFromPage(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    const [page, ranking] = await Promise.all([
      this.pageRepository.findOne({
        where: {
          locationId: location.id,
        },
        include: [
          {
            relation: 'background',
          },
        ],
      }),
      this.rankingsRepository.findOne({
        where: {
          locationId: location.id,
          userId,
        },
      }),
    ]);
    const [pageFoodReview, pageFoodPrice] = await Promise.all([
      this.pageReviewRepository.find({
        where: {
          pageId: page?.id,
        },
      }),
      this.getMinMaxPriceFood(page?.id || 0),
    ]);
    const isSavedLocation = Boolean(
      await this.myLocationsRepository.findOne({
        where: {
          locationId: get(location, 'id', 0),
          userId,
        },
      }),
    );
    return {
      ...omit(location, ['tour']),
      isSavedLocation,
      hadInteresting: Boolean(location?.interestings?.length),
      ...(location?.interestings?.length
        ? {
            interesting: location?.interestings[0],
          }
        : {}),
      pageId: page?.id,
      pageFoodGeneralInformation: page?.generalInformation?.food,
      pageFoodReview: {
        totalReview: pageFoodReview.length,
        averagePoint: pageFoodReview.length ? Math.round(_.sumBy(pageFoodReview, 'point') / pageFoodReview.length) : 0,
      },
      pageFoodPrice: {
        minPrice: pageFoodPrice.minPrice,
        maxPrice: pageFoodPrice.maxPrice,
      },
      ranking,
      attachments: {
        mediaContents: page?.background ? [page?.background] : [],
      },
    };
  }

  async getMinMaxPriceFood(
    pageId: number,
  ): Promise<{
    minPrice: PriceCurrencyInterface;
    maxPrice: PriceCurrencyInterface;
  }> {
    const [minPriceService, maxPriceService] = await Promise.all([
      this.serviceRepository.findOne({
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
      this.serviceRepository.findOne({
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

  async renderDataActivity(location: Locations, userId: number): Promise<LocationActivityInterface> {
    try {
      const activity = await this.findOneActivity({
        filter: {
          where: {
            locationId: location.id,
          },
        },
        userId,
      });

      return {
        ...location,
        ...(activity ? {activity} : {}),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        post: activity?.post,
        attachments: {
          mediaContents: activity?.post?.mediaContents || [],
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async renderDataStay(location: Locations, userId: number): Promise<LocationStayInterface> {
    try {
      const page = await this.pageRepository.findOne({
        where: {
          locationId: location.id,
        },
        include: [
          {
            relation: 'background',
          },
        ],
      });

      const [service, interesting] = await Promise.all([
        this.serviceRepository.findOne({
          where: {
            pageId: get(page, 'id', 0),
          },
          order: ['price ASC'],
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
            {
              relation: 'stay',
              scope: {
                include: [
                  {
                    relation: 'accommodationType',
                  },
                ],
              },
            },
          ],
        }),
        this.rankingsRepository.findOne({
          where: {
            locationId: location.id,
            userId,
          },
        }),
      ]);

      return {
        ...location,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        page,
        name: get(page, 'name'),
        service,
        pageId: get(page, 'id'),
        serviceId: service?.id,
        ...(get(service, 'stay')
          ? {
              stay: get(service, 'stay'),
            }
          : {}),
        hadInteresting: Boolean(interesting),
        attachments: {
          mediaContents: page?.background ? [page?.background] : [],
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async handleSearchResult(
    location: Locations,
    userId = 0,
  ): Promise<HandleSearchResultInterface | LocationActivityInterface | null> {
    const savedToBookmark = await this.bookmarkLocationHandler.bookmarkLocationRepository.findOne({
      where: {
        locationId: location.id,
        userId,
      },
    });
    const objectReturn = {
      [String(LocationTypesEnum.where)]: () => {
        return this.renderMediaFromPost(location, userId);
      },
      [String(LocationTypesEnum.tour)]: () => {
        return this.renderMediaInTour(location, userId);
      },
      [String(LocationTypesEnum.food)]: () => {
        return this.renderMediaFromPage(location, userId);
      },
      [String(LocationTypesEnum.activity)]: () => {
        return this.renderDataActivity(location, userId);
      },
      [String(LocationTypesEnum.stay)]: () => {
        return this.renderDataStay(location, userId);
      },
      [String(LocationTypesEnum.google)]: () => {
        return this.renderLocationFromGoogle(location, userId);
      },
    };
    const result = await objectReturn[String(location.locationType)]();
    return {
      ...result,
      locationId: location.id,
      savedToBookmark: Boolean(savedToBookmark),
    };
  }

  async getListLocationWithMediaContent(
    locationIds: number[],
    userId?: number,
  ): Promise<(HandleSearchResultInterface | LocationActivityInterface | null)[]> {
    const listLocation = await this.locationsRepository.find({
      where: {
        id: {
          inq: locationIds,
        },
      },
    });
    const sortList = sortByList(listLocation, 'id', locationIds);
    return Promise.all(
      sortList.map((item) => {
        return this.handleSearchResult(item, userId);
      }),
    );
  }

  async checkExist(
    name: string,
  ): Promise<{
    isExist: boolean;
  }> {
    const result = await this.locationsRepository.findOne({
      where: {
        name,
      },
    });
    return {
      isExist: Boolean(result),
    };
  }

  async findOneActivity({
    filter,
    userId,
  }: {
    userId: number;
    filter?: Filter<Activity>;
  }): Promise<ActivityDetailResponseInterface | null> {
    try {
      const activity = await this.activityRepository.findOne({
        ...filter,
        include: [
          {
            relation: 'currency',
          },
          {
            relation: 'location',
          },
        ],
      });
      if (activity) {
        const post = await this.findPostById({
          userId,
          id: activity.postId,
        });
        const participantCount = await this.activityParticipantRepository.count({
          activityId: activity.id,
          status: {
            nin: [participantStatusEnum.remove],
          },
        });
        const joined = await this.activityParticipantRepository.findOne({
          where: {
            activityId: activity.id,
            userId,
            status: {
              nin: [participantStatusEnum.remove],
            },
          },
        });
        return {
          post,
          mediaContents: post?.mediaContents || [],
          introduction: post?.content,
          ...activity,
          currency: activity?.currency,
          participantCount: participantCount.count,
          joined: Boolean(joined),
        };
      } else {
        return null;
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async findPostById({
    userId,
    id,
    filter,
  }: {
    userId: number;
    id: number;
    filter?: FilterExcludingWhere<Posts>;
  }): Promise<PostDataWithFlagInterface | null> {
    try {
      const target = await this.getDetailPostById(id, userId, false, filter).catch((e) => {
        return handleError(e);
      });
      if (target) {
        let isSavedLocation = false;
        if (target.locationId) {
          isSavedLocation = Boolean(
            await this.myLocationsRepository.findOne({
              where: {
                locationId: get(target, 'locationId', 0),
                userId,
              },
            }),
          );
        }
        return {
          ...target,
          liked: Boolean(target.likes && target.likes.length),
          marked: Boolean(target.bookmarks && target.bookmarks.length),
          rated: Boolean(target.rankings && target.rankings.length),
          isSavedLocation,
        };
      } else return target;
    } catch (e) {
      return handleError(e);
    }
  }

  async getDetailPostById(
    postId: number,
    userId: number,
    userAccess = false,
    filter?: Filter<Posts>,
  ): Promise<Partial<PostsWithRelations> | null> {
    try {
      const newFilter: Filter<Posts> = {
        include: [
          {
            relation: 'mediaContents',
          },
          {
            relation: 'location',
          },
          {
            relation: 'creator',
            scope: userInfoQuery(userAccess),
          },
          {
            relation: 'likes',
            scope: {
              where: {
                userId: userId,
              },
            },
          },
          {
            relation: 'bookmarks',
            scope: {
              where: {
                userId: userId,
              },
            },
          },
          {
            relation: 'rankings',
            scope: {
              where: {
                userId: userId,
              },
            },
          },
        ],
        ...filter,
      };
      return await this.postsRepository.findById(postId, newFilter);
    } catch (e) {
      return handleError(e);
    }
  }
}
