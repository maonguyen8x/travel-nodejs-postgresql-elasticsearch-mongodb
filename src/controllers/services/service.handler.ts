import {AnyObject, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import moment from 'moment';
import {
  AccommodationType,
  AccommodationTypeWithRelations,
  CustormStringObject,
  MediaContents,
  ModelFilterStayClass,
  Page,
  Service,
  ServiceReview,
  Stay,
  StayWithRelations,
  Tour,
  TourRelations,
} from '../../models';
import {
  AccommodationTypeRepository,
  AmenityRepository,
  BookingRepository,
  CurrencyRepository,
  FacilityRepository,
  LikesRepository,
  LocationsRepository,
  MediaContentsRepository,
  PageRepository,
  PostsRepository,
  RankingsRepository,
  ServiceRepository,
  StayRepository,
  StayReservationRepository,
  TimeToOrganizeTourRepository,
  TourRepository,
  UsersRepository,
} from '../../repositories';
import {handleError} from '../../utils/handleError';
import {ErrorCode} from '../../constants/error.constant';
import {ServiceStatusEnum, ServiceTypesEnum, SERVICE_HAS_BOOKING_CANNOT_DELETE} from '../../configs/service-constant';
import {
  ResponseServiceFoodDetailInterface,
  schemaStayInput,
  ServiceBodyPostRequest,
  ServiceDetailResponseInterface,
  ServiceTourBodyTourRequest,
  ServiceTourResponse,
  TourDetailInterface,
} from './service.constant';
import {POST_TYPE_SERVICE, PostStatusEnum} from '../../configs/post-constants';
import {reponseSuccess} from '../../constants/response.constant';
import {inject} from '@loopback/context';
import {PostLogicController} from '..';
import omit from 'lodash/omit';
import {LocationStatusEnum, LocationTypesEnum} from '../../configs/location-constant';
import {changeAlias, parseOrderToElasticSort, parseStringToGeo} from '../../utils/handleString';
import {nanoid} from 'nanoid';
import {RANKING_ACCESS_TYPE_ACCEPTED} from '../../configs/ranking-constant';
import {get, slice} from 'lodash';
import {asyncLimiter} from '../../utils/Async-limiter';
import {ELASTICwhereToMatchs, ELASTICwhereToNotMatchs, getHit} from '../../configs/utils-constant';
import {BookingStatusEnum} from '../booking/booking.constant';
import {LocationStayInterface} from '../util/util-interface';
import {FindPageServiceTourResponseInterface} from '../pages/page.interface';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {PostsHandler} from '../posts/posts.handler';

export class ServiceHandler {
  constructor(
    @repository(PageRepository) public pageRepository: PageRepository,
    @repository(ServiceRepository) public serviceRepository: ServiceRepository,
    @repository(PostsRepository) public postsRepository: PostsRepository,
    @repository(TourRepository) public tourRepository: TourRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(TimeToOrganizeTourRepository)
    public timeToOrganizeTourRepository: TimeToOrganizeTourRepository,
    @repository(UsersRepository) public usersRepository: UsersRepository,
    @repository(StayRepository) public stayRepository: StayRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(BookingRepository) public bookingRepository: BookingRepository,
    @repository(StayReservationRepository)
    public stayReservationRepository: StayReservationRepository,
    @repository(AmenityRepository) public amenityRepository: AmenityRepository,
    @repository(FacilityRepository)
    public facilityRepository: FacilityRepository,
    @repository(AccommodationTypeRepository)
    public accommodationTypeRepository: AccommodationTypeRepository,
    @repository(CurrencyRepository)
    public currencyRepository: CurrencyRepository,
    @repository(LikesRepository) public likesRepository: LikesRepository,
    @inject(HandlerBindingKeys.POSTS_HANDLER)
    public postsHandler: PostsHandler,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
  ) {}

  async createFood(data: ServiceBodyPostRequest, {currentUser}: {currentUser: UserProfile}): Promise<Service | null> {
    try {
      const userId = parseInt(currentUser[securityId]);
      await this.pageRepository.validatePermissionModifyPage(data.pageId, userId);
      const page = await this.pageRepository.findById(data.pageId);
      const post = await this.postsRepository.create({
        content: data.content,
        mediaContents: data.mediaContents,
        postType: POST_TYPE_SERVICE,
        creatorId: page?.relatedUserId,
      });
      const [serviceFood, minPriceFood, dataLocation] = await Promise.all([
        this.serviceRepository.create({
          name: data.name,
          price: data.price,
          currencyId: data.currencyId,
          postId: post.id,
          pageId: data.pageId,
          type: ServiceTypesEnum.food.toString(),
          flag: data.flag,
          status: data?.status,
        }),
        this.serviceRepository.findOne({
          order: ['price ASC'],
          where: {
            pageId: data.pageId,
            type: ServiceTypesEnum.food.toString(),
          },
        }),
        this.locationsRepository.findById(page.locationId),
      ]);
      dataLocation &&
        (await this.locationsRepository.updateById(
          page.locationId,
          {
            isPublished: true,
          },
          {
            price: minPriceFood?.price ? Math.min(data.price, minPriceFood.price) : data.price,
            ...(page.generalInformation?.food?.typeOfRestaurant
              ? {
                  typeOfRestaurant: page.generalInformation?.food?.typeOfRestaurant,
                }
              : {}),
          },
        ));
      return serviceFood;
    } catch (error) {
      return handleError(error);
    }
  }

  async updateFood(
    id: number,
    data: ServiceBodyPostRequest,
    {currentUser}: {currentUser: UserProfile},
  ): Promise<{success: boolean}> {
    try {
      const userId = parseInt(currentUser[securityId]);
      const service = await this.serviceRepository.findById(id, {
        include: [{relation: 'page'}],
      });
      const page = service.page;

      if (page.userId !== userId) throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);

      const [minPriceFood, dataLocation] = await Promise.all([
        this.serviceRepository.findOne({
          order: ['price ASC'],
          where: {
            pageId: page.id,
            type: ServiceTypesEnum.food.toString(),
          },
        }),
        this.locationsRepository.findById(page.locationId),
        this.postsRepository.updateById(service.postId, {
          content: data.content,
          mediaContents: data.mediaContents,
        }),
        this.serviceRepository.updateById(id, {
          name: data.name,
          price: data.price,
          currencyId: data.currencyId,
          flag: data.flag,
          status: data?.status,
        }),
      ]);
      dataLocation &&
        (await this.locationsRepository.updateById(
          page.locationId,
          {
            isPublished: true,
          },
          {
            price: minPriceFood?.price ? Math.min(data.price, minPriceFood.price) : data.price,
            ...(page.generalInformation?.food?.typeOfRestaurant
              ? {
                  typeOfRestaurant: page.generalInformation?.food?.typeOfRestaurant,
                }
              : {}),
          },
        ));
      return reponseSuccess;
    } catch (error) {
      return handleError(error);
    }
  }

  async findFoodById(id: number, {userId}: {userId: number}): Promise<ResponseServiceFoodDetailInterface> {
    try {
      const service = await this.serviceRepository.findById(id, {
        include: [
          {
            relation: 'currency',
          },
        ],
      });
      const filterPage: FilterExcludingWhere<Page> = {
        include: [
          {
            relation: 'avatar',
          },
        ],
      };
      const [post, page] = await Promise.all([
        this.postLogicController.getDetailPostById(service.postId, userId),
        this.pageRepository.findById(service.pageId, filterPage),
      ]);
      if (page?.relatedUserId !== userId && service.status === ServiceStatusEnum.draft) {
        throw new HttpErrors.NotFound(ErrorCode.SERVICE_NOT_FOUND);
      }
      const creator = {
        ...this.usersRepository.convertDataUser(post?.creator),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        avatar: page.avatar,
        name: post?.creator?.name || page?.name,
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...post,
        ...service,
        liked: Boolean(post?.likes && post?.likes?.length),
        marked: Boolean(post?.bookmarks && post?.bookmarks?.length),
        rated: Boolean(post?.rankings && post?.rankings?.length),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        creator,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById(id: number): Promise<{success: boolean}> {
    try {
      const serviceHasBooking = await this.bookingRepository.count({
        serviceId: id,
        status: {
          inq: [BookingStatusEnum.request, BookingStatusEnum.confirmed],
        },
      });
      if (serviceHasBooking.count > 0) {
        return handleError(new HttpErrors.NotFound(SERVICE_HAS_BOOKING_CANNOT_DELETE));
      }
      const service = await this.serviceRepository.findById(id, {
        include: [
          {
            relation: 'page',
            scope: {
              include: [
                {
                  relation: 'location',
                },
              ],
            },
          },
          {
            relation: 'stay',
          },
          {
            relation: 'post',
          },
          {
            relation: 'tour',
            scope: {
              include: [
                {
                  relation: 'location',
                },
              ],
            },
          },
        ],
      });
      await this.serviceRepository.deleteById(id);
      if (service?.post?.id) {
        await this.postsRepository.deleteById(service?.post?.id);
      }
      if (service.stay && service.stay.id) {
        await this.stayRepository.deleteById(service.stay.id);
        await this.stayRepository.elasticService.deleteById(service.id);
      }
      if (service.tour && service.tour.id) {
        await this.tourRepository.deleteById(service.tour.id);
        await this.locationsRepository.deleteById(service.tour.locationId);
      }
      if (service.type === ServiceTypesEnum.food.toString()) {
        const [minPriceFood, dataLocation] = await Promise.all([
          this.serviceRepository.findOne({
            order: ['price ASC'],
            where: {
              pageId: service.pageId,
              type: ServiceTypesEnum.food.toString(),
            },
          }),
          this.locationsRepository.findById(service.page.locationId),
        ]);
        dataLocation &&
          (await this.locationsRepository.updateById(
            service.page.locationId,
            {
              isPublished: minPriceFood?.price ? true : false,
            },
            {
              price: minPriceFood?.price ? minPriceFood.price : 0,
              ...(service.page.generalInformation?.food?.typeOfRestaurant
                ? {
                    typeOfRestaurant: service.page.generalInformation?.food?.typeOfRestaurant,
                  }
                : {}),
            },
          ));
      }
      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async createTour(
    data: ServiceTourBodyTourRequest,
    {currentUser}: {currentUser: UserProfile},
  ): Promise<ServiceTourResponse> {
    try {
      const userId = parseInt(currentUser[securityId]);
      await this.pageRepository.validatePermissionModifyPage(data.pageId, userId);
      const page = await this.pageRepository.findById(data.pageId);
      const locationName = `${page.name}: ${data.name}`;
      const locationExits = await this.locationsRepository.findOne({
        where: {
          name: locationName,
        },
      });
      const location = await this.locationsRepository.create({
        ...omit(data.location, ['text']),
        locationType: LocationTypesEnum.tour.toString(),
        name: locationExits ? `${locationName} ${nanoid()}` : `${locationName}`,
        userId: page.relatedUserId,
        status: LocationStatusEnum.draft,
      });

      const {descriptions, programs, mediaContents, timeToOrganizeTour} = data;

      const post = await this.postsRepository.create({
        mediaContents: mediaContents as MediaContents[],
        content: descriptions,
        postType: POST_TYPE_SERVICE,
        creatorId: page.relatedUserId,
        status: PostStatusEnum.draft,
        locationId: location.id,
      });

      const service = await this.serviceRepository.create({
        name: data.name,
        price: data.normalAdultPrice,
        currencyId: data.currencyId,
        postId: post.id,
        pageId: data.pageId,
        type: ServiceTypesEnum.tour.toString(),
        flag: data.flag,
        status: ServiceStatusEnum.draft,
      });

      const tourData: Partial<Tour> = {
        ...(omit(data, [
          'currencyId',
          'flag',
          'name',
          'pageId',
          'programs',
          'location',
          'timeToOrganizeTour',
          'mediaContents',
          'dateOff',
          'holidays',
          'vehicleServices',
          'includeServices',
        ]) as Tour),
        programs: programs,
        locationId: location?.id,
        serviceId: service.id,
        departureLocation: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          location: {
            ...location,
            name: data.location?.name,
          },
          text: data?.location?.text || '',
        },
        dateOff: (data.dateOff || []).map((item) => this.mirrorParseStringToObject(item)),
        holidays: (data.holidays || []).map((item) => this.mirrorParseStringToObject(item)),
        vehicleServices: (data.vehicleServices || []).map((item) => this.mirrorParseStringToObject(item)),
        includeServices: (data.includeServices || []).map((item) => this.mirrorParseStringToObject(item)),
      };

      const tour = await this.tourRepository.create(tourData);

      await Promise.all(
        (timeToOrganizeTour || []).map((item) =>
          this.timeToOrganizeTourRepository.create({
            ...item,
            tourId: tour.id,
          }),
        ),
      );
      await Promise.all([
        this.locationsRepository.updateById(location.id, {
          status: LocationStatusEnum.public,
        }),
        this.postsRepository.updateById(post.id, {
          status: PostStatusEnum.public,
        }),
        this.serviceRepository.updateById(service.id, {
          status: ServiceStatusEnum.public,
        }),
      ]);
      const dataLocationToES = await this.locationsRepository.findById(location.id);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.locationsRepository.handleUpdateElasticSearch(dataLocationToES, dataLocationToES.id, {
        ...(tour?.totalTourTime ? {totalTourTime: tour?.totalTourTime} : {}),
        ...(tour?.isDailyTour ? {isDailyTour: tour?.isDailyTour || false} : {}),
        ...(timeToOrganizeTour ? {timeToOrganizeTour: timeToOrganizeTour} : {}),
        ...(tour?.dateOff ? {dateOff: tour?.dateOff} : {}),
        tag: changeAlias([tour?.destinations?.map((item) => item.name)].join(', ')),
        price: data.normalAdultPrice,
      });
      // @ts-ignore
      return {
        ...tour,
        id: tour.serviceId,
        dateOff: (tour.dateOff || []).map((item) => this.mirrorParseObjectToString(item)),
        holidays: (tour.holidays || []).map((item) => this.mirrorParseObjectToString(item)),
        vehicleServices: (tour.vehicleServices || []).map((item) => this.mirrorParseObjectToString(item)),
        includeServices: (tour.includeServices || []).map((item) => this.mirrorParseObjectToString(item)),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async validateAmenities(amenityKeywords: string[]): Promise<void> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!amenityKeywords?.length) return;

      const count = await this.amenityRepository.count({
        keyword: {inq: amenityKeywords},
      });

      if (count.count !== amenityKeywords?.length) throw new HttpErrors.BadRequest(ErrorCode.INVALID_AMENITIES);
    } catch (error) {
      throw error;
    }
  }

  async validateFacilities(facilityKeywords: string[]): Promise<void> {
    // eslint-disable-next-line no-useless-catch
    try {
      if (!facilityKeywords?.length) return;

      const count = await this.facilityRepository.count({
        keyword: {inq: facilityKeywords},
      });

      if (count.count !== facilityKeywords?.length) throw new HttpErrors.BadRequest(ErrorCode.INVALID_FACILITIES);
    } catch (error) {
      throw error;
    }
  }

  async validateAccommodationType({id, pageId}: {id: number; pageId: number}): Promise<void> {
    try {
      const accommodationType = await this.accommodationTypeRepository.findById(id);

      if (accommodationType.pageId !== pageId) throw new HttpErrors.BadRequest(ErrorCode.INVALID_ACCOMODATIONTYPE);
    } catch (error) {
      throw error;
    }
  }

  async validateStayData(
    data: Partial<StayWithRelations> & {pageId: number},
    currentUser: UserProfile,
  ): Promise<Partial<StayWithRelations> & {pageId: number}> {
    // eslint-disable-next-line no-useless-catch
    try {
      const {status} = data;
      if (status !== ServiceStatusEnum.public) return data;

      const mediaContentIds = await this.mediaContentsRepository.validMediaContentIds(data.mediaContentIds || []);
      const stayData = {
        ...data,
        mediaContentIds,
      };
      const {error} = schemaStayInput.validate(stayData);
      if (error) throw new HttpErrors.BadRequest(error.message);

      await this.validateAmenities(stayData.amenities || []);
      await this.validateFacilities(stayData.facilities || []);
      await this.validateAccommodationType({
        id: stayData.accommodationTypeId || 0,
        pageId: stayData.pageId,
      });
      await this.currencyRepository.findById(stayData.currencyId);

      return stayData;
    } catch (error) {
      throw error;
    }
  }

  async createStay(stay: Partial<StayWithRelations> & {pageId: number}, currentUser: UserProfile): Promise<void> {
    try {
      const userId = parseInt(currentUser[securityId]);
      const page = await this.pageRepository.validatePermissionModifyPage(stay.pageId, userId);
      const data = await this.validateStayData(stay, currentUser);
      const status = data.status;

      const service = await this.serviceRepository.create({
        type: ServiceTypesEnum.stay.toString(),
        status: ServiceStatusEnum.draft,
        price: get(data, 'price', 0),
        pageId: page.id,
        currencyId: get(data, 'currencyId', 0),
        name: get(data, ['name'], ''),
      });

      const stayRecord = await this.stayRepository.create({
        ...omit(data, ['status', 'pageId', 'currencyId']),
        serviceId: service.id,
        status: ServiceStatusEnum.draft,
      });

      if (status === ServiceStatusEnum.public) {
        // will do validate stay
        const mediaContents = await this.mediaContentsRepository.find({
          where: {
            id: {inq: data.mediaContentIds},
          },
        });
        const post = await this.postsRepository.create({
          mediaContents: mediaContents,
          content: data.introduction,
          postType: POST_TYPE_SERVICE,
          creatorId: page.relatedUserId,
        });

        await this.serviceRepository.updateById(service.id, {
          status,
          postId: post.id,
          currencyId: get(data, 'currencyId', 0),
        });

        await this.stayRepository.updateById(stayRecord.id, {
          status,
        });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        await this.handleUpdateStayElasticSearch(service?.id);
      }

      return;
    } catch (e) {
      return handleError(e);
    }
  }

  async updateStayById(
    id: number,
    stay: Partial<StayWithRelations> & {pageId: number},
    currentUser: UserProfile,
  ): Promise<void> {
    try {
      const userId = parseInt(currentUser[securityId]);
      const page = await this.pageRepository.validatePermissionModifyPage(stay.pageId, userId);
      const data = await this.validateStayData(stay, currentUser);
      const status = data.status;

      const service = await this.serviceRepository.findById(id, {
        include: [
          {
            relation: 'stay',
          },
        ],
      });

      const stayId = get(service, 'stay.id');

      if (status === ServiceStatusEnum.public) {
        // will do validate stay
        const mediaContents = await this.mediaContentsRepository.find({
          where: {
            id: {inq: data.mediaContentIds},
          },
        });
        const post = await this.postsRepository.create({
          mediaContents: mediaContents,
          content: data.introduction,
          postType: POST_TYPE_SERVICE,
          creatorId: page.relatedUserId,
        });

        await this.serviceRepository.updateById(service.id, {
          status,
          postId: post.id,
          price: get(data, 'price', 0),
          currencyId: get(data, 'currencyId', 0),
        });
      }

      await this.stayRepository.replaceById(stayId, {
        ...service.stay,
        ...omit(data, ['pageId', 'currencyId']),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.handleUpdateStayElasticSearch(id);
      return;
    } catch (error) {
      return handleError(error);
    }
  }

  async findStayById(id: number, currentUser: UserProfile): Promise<Partial<ServiceDetailResponseInterface>> {
    try {
      const userId = parseInt(currentUser[securityId]);
      const service = await this.serviceRepository.findById(id, {
        include: [
          {
            relation: 'serviceReview',
          },
          {
            relation: 'specialDayPrices',
          },
          {
            relation: 'offDays',
          },
          {
            relation: 'currency',
          },
          {
            relation: 'post',
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
          {
            relation: 'page',
            scope: {
              include: [
                {
                  relation: 'location',
                  scope: {
                    include: [
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
                {
                  relation: 'avatar',
                },
                {
                  relation: 'stayPropertytype',
                },
                {
                  relation: 'background',
                },
              ],
            },
          },
        ],
      });

      const like = await this.likesRepository.findOne({
        where: {
          postId: service.postId,
          userId,
        },
      });
      const liked = Boolean(like);
      const ranking = await this.rankingsRepository.findOne({
        where: {
          postId: service.postId,
          userId,
        },
      });
      const rated = Boolean(ranking);
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const isSavedLocation = Boolean(service?.page?.location?.myLocations?.length);
      const stay = service.stay;
      const mediaContents = await this.mediaContentsRepository.find({
        where: {id: {inq: get(stay, 'mediaContentIds', [])}},
      });
      const averagePointStay =
        service?.serviceReview?.length > 0
          ? service?.serviceReview
              ?.map((o: ServiceReview) => o.point)
              .reduce((a: number, c: number) => {
                return a + c;
              }) / service.serviceReview.length
          : 0;

      return {
        ...stay,
        id: service.id,
        mediaContents,
        page: {
          ...service.page,
          location: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            ...service.page.location,
            isSavedLocation,
          },
        },
        currency: service.currency,
        post: {
          ...service.post,
          liked,
          rated,
        },
        specialDayPrices: service.specialDayPrices,
        offDays: service.offDays,
        averagePointStay: Math.round(averagePointStay),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findServiceTour(
    userId: number,
    pageId: number,
    filter?: Filter<Service>,
  ): Promise<{
    count: number;
    data: FindPageServiceTourResponseInterface[];
  }> {
    const customerFilter: Filter<Service> = {
      ...filter,
      include: [
        {
          relation: 'currency',
        },
      ],
      where: {
        ...filter?.where,
        pageId,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
      },
    };
    const result = await this.serviceRepository.find({
      ...customerFilter,
    });
    const count = await this.serviceRepository.count(customerFilter.where);
    const data = await Promise.all(result.map((item) => this.convertServiceTourInfo(item, userId)));
    return {
      count: count.count,
      data,
    };
  }

  async convertServiceTourInfo(service: Service, userId: number): Promise<FindPageServiceTourResponseInterface> {
    const tour = await this.getTourInfo(service?.id);
    const post = await this.postsHandler.getDetailPostServiceById(service.postId, userId);
    const isSavedLocation = await this.postLogicController.checkLocationHadSaveToMyMap({
      userId,
      locationId: tour?.locationId || 0,
    });
    const isRatedLocation = await this.locationsRepository.isRatedLocation(tour?.locationId || 0, userId);
    const ranking = await this.rankingsRepository.findOne({
      where: {
        userId,
        locationId: tour?.locationId,
      },
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
      ...service,
      tour: {
        destinations: tour?.destinations,
        vehicleServices: tour?.vehicleServices?.map((item) => item.value),
        totalTourTime: tour?.totalTourTime,
      },
      ranking,
      post: post,
      isSavedLocation,
      attachments: post.mediaContents,
      content: post.content,
      locationId: tour?.locationId,
      rated: isRatedLocation,
      averagePoint: !isNaN(Number(tour?.location?.averagePoint)) ? Math.round(Number(tour?.location?.averagePoint)) : 0,
      totalRanking: !isNaN(Number(tour?.location?.totalReview)) ? Math.round(Number(tour?.location?.totalReview)) : 0,
    };
  }

  async getTourInfo(serviceId?: number): Promise<(Tour & TourRelations) | null> {
    return this.tourRepository.findOne({
      where: {
        serviceId,
      },
      include: [
        {
          relation: 'location',
        },
      ],
    });
  }

  async findStay({
    filter,
    currentUser,
  }: {
    filter?: Filter<Stay>;
    currentUser: UserProfile;
  }): Promise<{count: number; data: ServiceDetailResponseInterface[]}> {
    try {
      const [{count}, stays] = await Promise.all([
        this.stayRepository.count(filter?.where),
        this.stayRepository.find(filter),
      ]);

      const data = await Promise.all(stays.map((stay) => this.findStayById(stay.serviceId || 0, currentUser)));

      return {
        count,
        data,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async handleElasticSearchFilterStay({
    filter,
    dateRange,
  }: {
    dateRange: {
      checkoutDate?: string;
      checkinDate?: string;
    };
    filter?: Filter<Stay>;
  }): Promise<AnyObject> {
    try {
      const matchs = ELASTICwhereToMatchs({
        ...filter?.where,
        status: ServiceStatusEnum.public,
      });

      const notMatchs = ELASTICwhereToNotMatchs({...filter?.where});
      const body: AnyObject = {
        sort: [...parseOrderToElasticSort(filter?.order || [''])],
        _source: ['pageId', 'serviceId'],
        ...(filter?.limit ? {size: filter?.limit} : {}),
        ...(filter?.offset ? {from: filter?.offset} : {}),
        query: {
          bool: {
            must: matchs,
            must_not: [...notMatchs],
          },
        },
      };
      if (dateRange.checkinDate && dateRange.checkoutDate) {
        body.query.bool['must_not'].push({
          bool: {
            should: [
              {
                range: {
                  'booking.endDate': {
                    gt: dateRange.checkinDate,
                    lte: dateRange.checkoutDate,
                    format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                  },
                },
              },
              {
                range: {
                  'booking.startDate': {
                    gte: dateRange.checkinDate,
                    lt: dateRange.checkoutDate,
                    format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                  },
                },
              },
              {
                bool: {
                  must: [
                    {
                      range: {
                        'booking.startDate': {
                          gte: dateRange.checkinDate,
                          format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                        },
                      },
                    },
                    {
                      range: {
                        'booking.endDate': {
                          lte: dateRange.checkoutDate,
                          format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        });
      }
      return await this.stayRepository.elasticService.get(body);
    } catch (e) {
      return handleError(e);
    }
  }

  async filterStay({
    filter,
    currentUser,
    dateRange,
  }: {
    dateRange: {
      checkoutDate?: string;
      checkinDate?: string;
    };
    filter?: Filter<Stay>;
    currentUser: UserProfile;
  }): Promise<{count: number; data: ServiceDetailResponseInterface[]}> {
    try {
      const result = await this.handleElasticSearchFilterStay({
        filter,
        dateRange,
      });
      const hits = getHit(result);
      const count = get(result, 'body.hits.total.value', 0);
      const converting = hits.map((item: {_source: {serviceId: number; pageId: number}}) => {
        return {
          serviceId: get(item, ['_source', 'serviceId']),
          pageId: get(item, ['_source', 'pageId']),
        };
      });

      return {
        count,
        data: await Promise.all(
          converting.map((stay: {serviceId: number}) => this.findStayById(stay.serviceId || 0, currentUser)),
        ),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findServiceStay(
    filter: Filter<Service>,
    currentUser: UserProfile,
  ): Promise<{count: number; data: ServiceDetailResponseInterface[]}> {
    try {
      const [{count}, services] = await Promise.all([
        this.serviceRepository.count(filter.where),
        this.serviceRepository.find(filter),
      ]);
      return {
        count,
        data: await Promise.all(services.map((service) => this.findStayById(service.id || 0, currentUser))),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findAvailableStayByAccommodationType(
    pageId: number,
    accommodationType: AccommodationType,
    currentUser: UserProfile,
    stayFilterSearch?: {
      checkoutDate?: string;
      checkinDate?: string;
    },
    filter?: Filter<Stay>,
  ): Promise<Partial<AccommodationTypeWithRelations> | undefined> {
    try {
      const result = await this.handleElasticSearchFilterStay({
        dateRange: {
          checkinDate: stayFilterSearch?.checkinDate,
          checkoutDate: stayFilterSearch?.checkoutDate,
        },
        filter: {
          ...filter,
          where: {
            ...filter?.where,
            ...(pageId
              ? {
                  pageId,
                }
              : {}),
            accommodationTypeId: accommodationType.id,
          },
          offset: 0,
        },
      });
      const hits = getHit(result);
      const converting = hits.map((item: {_source: {serviceId: number; pageId: number}}) => {
        return {
          serviceId: get(item, ['_source', 'serviceId']),
          pageId: get(item, ['_source', 'pageId']),
        };
      });
      if (!converting?.length || !converting[0]) {
        return undefined;
      }
      const firstItem = converting[0];
      const stays = [await this.findStayById(firstItem.serviceId, currentUser)];
      const total = await this.stayRepository.count({
        accommodationTypeId: accommodationType.id,
      });
      const countAvailable = get(result, 'body.hits.total.value', 0);
      return {
        ...accommodationType,
        stays,
        total: total.count,
        numOfAvailable: countAvailable,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findStayByAccommodationType(
    pageId: number,
    accommodationType: AccommodationType,
    currentUser: UserProfile,
  ): Promise<Partial<AccommodationTypeWithRelations> | undefined> {
    try {
      const listStay = await this.stayRepository.find({
        where: {
          accommodationTypeId: accommodationType.id,
        },
      });

      const stays = await Promise.all(
        listStay.map(async (item) => {
          return this.findStayById(item.serviceId, currentUser);
        }),
      );

      return {
        ...accommodationType,
        stays,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  mirrorParseStringToObject(value: string): {value: string} {
    return {
      value,
    };
  }

  mirrorParseObjectToString(data: CustormStringObject): string {
    return data.value;
  }

  async findTourByTourId({
    userId,
    serviceId,
    pageId,
  }: {
    userId: number;
    serviceId: number;
    pageId: number;
  }): Promise<TourDetailInterface> {
    try {
      /**
       * validate serviceId vs pageId
       */
      await this.validateNormalServiceTour({serviceId, pageId}).catch((e) => handleError(e));

      const targetService = await this.serviceRepository.findOne({
        where: {
          id: serviceId,
          pageId: pageId,
          type: ServiceTypesEnum.tour.toString(),
        },
        include: [
          {
            relation: 'serviceReview',
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
            relation: 'currency',
          },
        ],
      });
      const page = await this.pageRepository.findById(targetService?.pageId, {
        include: [
          {
            relation: 'avatar',
          },
        ],
      });
      if (!targetService) {
        return handleError(new HttpErrors.NotFound(ErrorCode.SERVICE_NOT_FOUND));
      }

      const tour = await this.tourRepository.findOne({
        where: {
          serviceId: targetService.id,
        },
        include: [
          {
            relation: 'timeToOrganizeTours',
            scope: {
              where: {
                startDate: {
                  gte: moment().utc().toISOString(),
                },
                deletedAt: null,
              },
            },
          },
          {
            relation: 'location',
          },
        ],
      });

      const dateOff = tour?.dateOff
        ?.filter((item) => moment(item.value).isAfter(moment()))
        .map((item) => this.mirrorParseObjectToString(item));
      let isSavedLocation = false;
      if (tour?.locationId) {
        isSavedLocation = await this.postLogicController.checkLocationHadSaveToMyMap({
          userId,
          locationId: tour.locationId,
        });
      }
      const post = await this.postLogicController.findById({
        userId,
        id: targetService?.postId,
      });
      const isRatedLocation = await this.locationsRepository.isRatedLocation(tour?.locationId || 0, userId);
      const ranking = await this.rankingsRepository.findOne({
        where: {
          userId,
          locationId: tour?.locationId,
        },
      });
      const averagePointTour =
        targetService?.serviceReview?.length > 0
          ? targetService?.serviceReview
              ?.map((o: ServiceReview) => o.point)
              .reduce((a: number, c: number) => {
                return a + c;
              }) / targetService.serviceReview.length
          : 0;

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...tour,
        //serviceId for update
        id: targetService.id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        location: {
          ...tour?.location,
          name: tour?.departureLocation?.location.name,
        },
        service: targetService,
        currency: targetService.currency,
        name: targetService.name,
        page: page,
        flag: targetService.flag,
        mediaContents: targetService?.post?.mediaContents || [],
        dateOff: dateOff,
        isSavedLocation,
        post,
        rated: isRatedLocation,
        ranking: ranking,
        holidays: (tour?.holidays || []).map((item) => this.mirrorParseObjectToString(item)),
        vehicleServices: (tour?.vehicleServices || []).map((item) => this.mirrorParseObjectToString(item)),
        includeServices: (tour?.includeServices || []).map((item) => this.mirrorParseObjectToString(item)),
        averagePoint: !isNaN(Number(tour?.location.averagePoint)) ? Math.round(Number(tour?.location.averagePoint)) : 0,
        totalRanking: !isNaN(Number(tour?.location.totalReview)) ? Math.round(Number(tour?.location.totalReview)) : 0,
        averagePointTour: Math.round(averagePointTour),
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async updateTour({
    data,
    userId,
    serviceId,
    pageId,
  }: {
    data: ServiceTourBodyTourRequest;
    userId: number;
    serviceId: number;
    pageId: number;
  }): Promise<ServiceTourResponse> {
    try {
      await this.pageRepository.validatePermissionModifyPage(pageId, userId);
      // await this.tourRepository.validateCreate(data);
      const targetService = await this.serviceRepository.findById(serviceId);
      const targetTour = await this.tourRepository.findOne({
        where: {
          serviceId: serviceId,
        },
      });
      if (data.location) {
        const targetLocation = await this.locationsRepository.findById(targetTour?.locationId);
        await this.locationsRepository.updateById(targetTour?.locationId, {
          ...omit(data.location, ['text']),
          name: targetLocation.name,
        });
      }

      const {descriptions, mediaContents, timeToOrganizeTour} = data;

      await this.postsRepository.updateById(targetService?.postId, {
        mediaContents: mediaContents as MediaContents[],
        content: descriptions,
      });

      await this.serviceRepository.updateById(serviceId, {
        name: data?.name || targetService.name,
        price: data?.normalAdultPrice || targetService.price,
        currencyId: data?.currencyId || targetService.currencyId,
        flag: data?.flag,
      });

      let currentTour = await this.tourRepository.findOne({
        where: {
          serviceId: serviceId,
        },
      });

      const location = await this.locationsRepository.findById(targetTour?.locationId);
      const tourData: Partial<Tour> = {
        ...currentTour,
        ...(omit(data, [
          'currencyId',
          'flag',
          'name',
          'pageId',
          'location',
          'timeToOrganizeTour',
          'mediaContents',
          'dateOff',
          'holidays',
          'vehicleServices',
          'includeServices',
        ]) as Tour),
        departureLocation: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          location: {
            ...location,
            name: data?.location?.name || targetTour?.departureLocation?.location?.name,
          },
          text: data?.location?.text || '',
        },
        dateOff: (data?.dateOff || []).map((item: string) => this.mirrorParseStringToObject(item)),
        holidays: (data?.holidays || []).map((item: string) => this.mirrorParseStringToObject(item)),
        vehicleServices: (data?.vehicleServices || []).map((item: string) => this.mirrorParseStringToObject(item)),
        includeServices: (data?.includeServices || []).map((item: string) => this.mirrorParseStringToObject(item)),
      };

      await this.tourRepository.replaceById(currentTour?.id, tourData);
      currentTour = await this.tourRepository.findOne({
        where: {
          serviceId: serviceId,
        },
      });
      if (!currentTour?.isDailyTour && Array.isArray(timeToOrganizeTour)) {
        await this.timeToOrganizeTourRepository.deleteAll({
          tourId: currentTour?.id,
        });
        await Promise.all(
          timeToOrganizeTour.map((item) =>
            this.timeToOrganizeTourRepository.create({
              ...item,
              tourId: currentTour?.id,
            }),
          ),
        );
      }
      const tour = await this.tourRepository.findById(currentTour?.id);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.locationsRepository.handleUpdateElasticSearch(location, location.id, {
        ...(tour?.totalTourTime ? {totalTourTime: tour?.totalTourTime} : {}),
        ...(tour?.isDailyTour ? {isDailyTour: tour?.isDailyTour || false} : {}),
        ...(timeToOrganizeTour ? {timeToOrganizeTour: timeToOrganizeTour} : {}),
        ...(tour?.dateOff ? {dateOff: tour?.dateOff} : {}),
        tag: changeAlias([tour?.destinations?.map((item) => item.name)].join(', ')),
        price: tour?.normalAdultPrice || targetService.price,
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...currentTour,
        id: serviceId,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async validateNormalServiceTour({serviceId, pageId}: {serviceId: number; pageId: number}): Promise<void> {
    try {
      /**
       * validate serviceId vs pageId
       */
      const isExistService = await this.serviceRepository.findOne({
        where: {
          id: serviceId,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
        },
      });
      const isExistPageId = await this.pageRepository.findOne({
        where: {
          id: pageId,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
        },
      });
      if (!isExistService) {
        return handleError(new HttpErrors.NotFound(ErrorCode.SERVICE_NOT_FOUND));
      }
      if (!isExistPageId) {
        return handleError(new HttpErrors.NotFound(ErrorCode.PAGE_NOT_FOUND));
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async handleUpdateStayElasticSearch(serviceId?: number): Promise<void> {
    try {
      if (!serviceId) {
        return;
      }
      const service = await this.serviceRepository.findById(serviceId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [page, stay]: any = await Promise.all([
        this.pageRepository.findById(service.pageId, {
          include: [
            {
              relation: 'location',
            },
          ],
        }),
        this.stayRepository.findOne({
          where: {
            serviceId: serviceId,
          },
        }),
      ]);
      const {coordinates, formatedAddress} = page?.location || {};
      const {name, id, location, stayPropertytypeId} = page || {};
      const averagePoint = get(location, 'averagePoint', 0);
      const {status, currencyId} = service || {};

      const {
        facilities,
        amenities,
        acreage,
        numberOfBedroom,
        numberOfBed,
        numberOfSingleBed,
        numberOfDoubleBed,
        numberOfLargeDoubleBed,
        numberOfLargeBed,
        numberOfSuperLargeBed,
        numberOfMattress,
        numberOfSofa,
        numberOfBunk,
        numberOfBathroom,
        numberOfPrivateBathroom,
        numberOfSharedBathroom,
        numberOfKitchen,
        numberOfPrivateKitchen,
        numberOfSharedKitchen,
        numberOfStandardGuest,
        maxNumberOfGuest,
        numberOfAdult,
        numberOfChild,
        numberOfInfant,
        price,
        priceWeekend,
        accommodationTypeId,
      } = stay || {};
      await this.stayRepository.elasticService.updateById(
        {
          coordinates,
          formatedAddress: changeAlias(formatedAddress),
          status,
          currencyId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          facilities: facilities?.map((item: any) => changeAlias(item)),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          amenities: amenities?.map((item: any) => changeAlias(item)),
          acreage,
          numberOfBedroom,
          numberOfBed,
          numberOfSingleBed,
          numberOfDoubleBed,
          numberOfLargeDoubleBed,
          numberOfLargeBed,
          numberOfSuperLargeBed,
          numberOfMattress,
          numberOfSofa,
          numberOfBunk,
          numberOfBathroom,
          numberOfPrivateBathroom,
          numberOfSharedBathroom,
          numberOfKitchen,
          numberOfPrivateKitchen,
          numberOfSharedKitchen,
          numberOfStandardGuest,
          maxNumberOfGuest,
          numberOfAdult,
          numberOfChild,
          numberOfInfant,
          price: Number(price),
          priceWeekend: Number(priceWeekend),
          pageName: changeAlias(name),
          pageId: id,
          serviceId,
          accommodationTypeId,
          averagePoint,
          id: serviceId,
          stayPropertytypeId,
        },
        serviceId,
      );
    } catch (e) {
      return handleError(e);
    }
  }

  async handleUpdateListStayElasticSearch(pageId: number): Promise<void> {
    const listService = await this.serviceRepository.find({
      where: {
        pageId,
      },
    });
    await asyncLimiter(listService.map((item) => this.handleUpdateStayElasticSearch(get(item, 'id', 0))));
  }

  async handleSearchStay({
    where,
    q,
    filter,
    userId,
    coordinates,
    distance,
    checkinDate,
    checkoutDate,
    listPageId,
  }: {
    where?: Where<ModelFilterStayClass>;
    q?: string;
    filter?: Filter<Service>;
    userId?: number;
    coordinates?: string;
    distance?: number;
    checkinDate?: string;
    checkoutDate?: string;
    listPageId?: any;
  }): Promise<{
    count: number;
    data: LocationStayInterface[];
  }> {
    const result = await this.handleElasticSearchStay({
      where,
      q,
      filter,
      coordinates,
      distance,
      checkinDate,
      checkoutDate,
      listPageId,
    });
    const hits = getHit(result);
    const converting = hits.map((item: {_source: {serviceId: number; pageId: number; price: number}}) => {
      return {
        serviceId: get(item, ['_source', 'serviceId']),
        price: get(item, ['_source', 'price']),
        pageId: get(item, ['_source', 'pageId']),
      };
    });
    const pageIds: number[] = [];
    const topService: {serviceId: number; pageId: number; price: number}[] = [];
    converting.map((item: {serviceId: number; pageId: number; price: number}) => {
      if (!pageIds.includes(item.pageId)) {
        pageIds.push(item.pageId);
        topService.push(item);
      }
    });
    const count = get(result, ['body', 'aggregations', 'pages', 'buckets', 'length'], 0);
    const offset = get(filter, 'offset', 0);
    const limit = get(filter, 'limit', 10);
    const data = await asyncLimiter(
      slice(topService, offset, offset + limit).map((item) => this.renderDataStay(item, userId)),
    );
    return {
      data: data,
      count: count,
    };
  }

  async handleElasticSearchStay({
    where,
    q,
    filter,
    coordinates,
    distance,
    checkinDate,
    checkoutDate,
    listPageId,
  }: {
    where?: Where<ModelFilterStayClass>;
    q?: string;
    filter?: Filter<Service>;
    coordinates?: string;
    distance?: number;
    checkinDate?: string;
    checkoutDate?: string;
    listPageId: any;
  }): Promise<AnyObject> {
    const matchs = ELASTICwhereToMatchs({
      ...where,
      status: ServiceStatusEnum.public,
      ...(listPageId?.length > 0 && {
        pageId: {
          inq: listPageId,
        },
      }),
    });

    const notMatchs = ELASTICwhereToNotMatchs({...where});
    if (q?.length) {
      matchs.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['pageName', 'formatedAddress'],
        },
      });
    }
    const body: AnyObject = {
      sort: [
        ...(q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
        ...parseOrderToElasticSort(filter?.order || ['']),
      ],
      _source: ['pageId', 'serviceId', 'price'],
      // size : filter?.limit,
      // from : filter?.offset,
      query: {
        bool: {
          must: matchs,
          must_not: [...notMatchs],
        },
      },
      aggs: {
        pages: {
          composite: {
            size: 10000,
            sources: [{pageId: {terms: {field: 'pageId'}}}],
          },
        },
      },
    };
    if (coordinates) {
      body.sort = [
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
    if (checkinDate && checkoutDate) {
      body.query.bool['must_not'].push(this.generateElasticsQueryCheckinDateStay(checkinDate, checkoutDate));
    }
    return this.stayRepository.elasticService.get(body);
  }

  generateElasticsQueryCheckinDateStay(checkinDate: string, checkoutDate: string): AnyObject {
    return {
      bool: {
        should: [
          {
            range: {
              'booking.endDate': {
                gt: checkinDate,
                lte: checkoutDate,
                format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
              },
            },
          },
          {
            range: {
              'booking.startDate': {
                gte: checkinDate,
                lt: checkoutDate,
                format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
              },
            },
          },
          {
            bool: {
              must: [
                {
                  range: {
                    'booking.startDate': {
                      gte: checkinDate,
                      format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    },
                  },
                },
                {
                  range: {
                    'booking.endDate': {
                      lte: checkoutDate,
                      format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    },
                  },
                },
              ],
            },
          },
          //dayoff
          {
            range: {
              'dayoffs.endDate': {
                gt: checkinDate,
                lte: checkoutDate,
                format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
              },
            },
          },
          {
            range: {
              'dayoffs.startDate': {
                gte: checkinDate,
                lt: checkoutDate,
                format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
              },
            },
          },
          {
            bool: {
              must: [
                {
                  range: {
                    'dayoffs.startDate': {
                      gte: checkinDate,
                      format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    },
                  },
                },
                {
                  range: {
                    'dayoffs.endDate': {
                      lte: checkoutDate,
                      format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }

  async renderDataStay(
    {pageId, serviceId}: {pageId?: number; serviceId?: number},
    userId?: number,
  ): Promise<LocationStayInterface> {
    try {
      const page = await this.pageRepository.findById(pageId, {
        include: [
          {
            relation: 'stayPropertytype',
          },
        ],
      });
      const [service, location, interesting] = await Promise.all([
        this.serviceRepository.findById(serviceId, {
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
        this.locationsRepository.findById(page?.locationId),
        this.locationsRepository.interestings(page.locationId).find({
          where: {
            locationId: page.locationId,
            userId,
          },
        }),
      ]);
      let mediaContents: MediaContents[] = [];
      if (
        get(service, ['stay', 'mediaContentIds'], [])?.length &&
        get(service, ['stay', 'mediaContentIds'], []).filter((item) => item)
      ) {
        mediaContents = await this.mediaContentsRepository.find({
          where: {
            id: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              inq: get(service, ['stay', 'mediaContentIds'], null).filter((item) => item),
            },
          },
        });
      }
      const isSavedLocation = await this.postLogicController.checkLocationHadSaveToMyMap({
        locationId: location.id || 0,
        userId: userId || 0,
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...location,
        page,
        isSavedLocation,
        name: get(page, 'name'),
        service: {
          ...service,
          name: service.name || get(service, ['stay', 'name']),
        },
        pageId: get(page, 'id'),
        serviceId: service?.id,
        ...(get(service, 'stay')
          ? {
              stay: get(service, 'stay'),
            }
          : {}),
        hadInteresting: Boolean(interesting?.length),
        attachments: {
          mediaContents,
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async getListBookingOfService(serviceId: number) {
    try {
      if (!serviceId) {
        throw new HttpErrors.BadGateway(ErrorCode.INVALID_SERVICE_ID);
      }
      const exist = await this.serviceRepository.exists(serviceId);
      if (!exist) {
        throw new HttpErrors.BadGateway(ErrorCode.INVALID_SERVICE_ID);
      }
      const service = await this.serviceRepository.findById(serviceId);
      if (service.type !== ServiceTypesEnum.stay.toString()) {
        throw new HttpErrors.BadGateway(ErrorCode.INVALID_SERVICE_ID);
      }

      const [{count}, data] = await Promise.all([
        this.bookingRepository.count({
          serviceId,
          status: BookingStatusEnum.confirmed,
        }),
        this.bookingRepository.find({
          where: {
            serviceId,
            status: BookingStatusEnum.confirmed,
          },
          include: [
            {
              relation: 'stayReservation',
            },
          ],
        }),
      ]);
      return {
        count,
        data,
      };
    } catch (e) {
      return handleError(e);
    }
  }
}
