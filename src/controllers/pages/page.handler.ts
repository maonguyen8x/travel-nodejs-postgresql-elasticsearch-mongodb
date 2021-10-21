import {AnyObject, Filter, FilterExcludingWhere, repository, IsolationLevel} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {TRANSACTION_TIMEOUT} from '../../constants/variable.constant';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';

import {
  AccommodationType,
  AccommodationTypeWithRelations,
  Locations,
  LocationsWithRelations,
  Page,
  PageRelations,
  PageVerification,
  PageVerificationWithRelations,
  PageWithRelations,
  Posts,
  PropertyType,
  Service,
  Stay,
} from '../../models';
import {
  AvatarsRepository,
  BackgroundsRepository,
  LocationsRepository,
  MediaContentsRepository,
  PageRepository,
  PageReviewRepository,
  PostsRepository,
  ProfilesRepository,
  RankingsRepository,
  ServiceRepository,
  TourRepository,
  UsersRepository,
  PageVerificationRepository,
  AccommodationTypeRepository,
  StayRepository,
  FollowRepository,
  PropertyTypeRepository,
  NotificationRepository,
} from '../../repositories';
import {handleError} from '../../utils/handleError';
import {ErrorCode} from '../../constants/error.constant';
import {PageTypesEnum} from '../../configs/page-constant';
import {inject} from '@loopback/context';
import {MessagesHandlerController, PostLogicController} from '..';
import {POST_ACCESS_TYPE_PUBLIC, POST_TYPE_PAGE} from '../../configs/post-constants';
import {
  FindPageNewsInterface,
  FindPageServiceFoodInterface,
  PageCovertForPostInterface,
  PageReviewResponseInterface,
  UserPage,
} from './page.interface';
import {RANKING_ACCESS_TYPE_ACCEPTED} from '../../configs/ranking-constant';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {PostsHandler} from '../posts/posts.handler';
import {USER_ROLE_NORMAL_USER, USER_TYPE_ACCESS_PAGE} from '../../configs/user-constants';
import {AvatarDefaultPage, BgDefaultPage} from '../../configs/media-contents-constants';
import {LocationStatusEnum, LocationTypesEnum} from '../../configs/location-constant';
import {
  changeAlias,
  parseOrderToElasticSort,
  concatStringForElastic,
  convertNameToUserNameUnique,
} from '../../utils/handleString';
import _, {compact, has} from 'lodash';
import {ElasticSearchResultHitInterface, getHit} from '../../configs/utils-constant';
import {
  UpdateFoodGeneralInfomationInterface,
  UpdateStayGeneralInfomationInterface,
  VerifyPageStatus,
} from './page.constant';
import {asyncLimiter} from '../../utils/Async-limiter';
import {ServiceHandler} from '../services/service.handler';
import * as Joi from 'joi';
import {FOLLOW_STATUS_ACCEPTED} from '../../configs/follow-constants';
import {PageReviewHandler} from '../page-review/page-review.handler';
import {ServiceTypesEnum} from '../../configs/service-constant';

export class PageHandler {
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @inject('controllers.MessagesHandlerController')
    public messagesHandlerController: MessagesHandlerController,
    @repository(PageRepository) public pageRepository: PageRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(ServiceRepository) public serviceRepository: ServiceRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(UsersRepository) public usersRepository: UsersRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(TourRepository) public tourRepository: TourRepository,
    @repository(ProfilesRepository)
    public profilesRepository: ProfilesRepository,
    @repository(AvatarsRepository) public avatarsRepository: AvatarsRepository,
    @repository(BackgroundsRepository)
    public backgroundsRepository: BackgroundsRepository,
    @repository(PageVerificationRepository)
    public pageVerificationRepository: PageVerificationRepository,
    @repository(FollowRepository) public followRepository: FollowRepository,
    @repository(PropertyTypeRepository)
    public propertyTypeRepository: PropertyTypeRepository,
    @repository(AccommodationTypeRepository)
    public accommodationTypeRepository: AccommodationTypeRepository,
    @repository(StayRepository) public stayRepository: StayRepository,
    @repository(PageReviewRepository)
    public pageReviewRepository: PageReviewRepository,

    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
    @inject(HandlerBindingKeys.POSTS_HANDLER)
    public postsHandler: PostsHandler,
    @inject(HandlerBindingKeys.SERVICE_HANDLER)
    public serviceHandler: ServiceHandler,
    @inject(HandlerBindingKeys.PAGE_REVIEW_HANDLER)
    public pageReviewHandler: PageReviewHandler,
  ) {}

  validateCreatePage(data: Page & PageRelations): void {
    const schema = Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
      locationId: Joi.number().optional(),
      bio: Joi.string(),
      isOfficial: Joi.bool(),
      businessType: Joi.string(),
      avatarId: Joi.number(),
      backgroundId: Joi.number(),
      stayPropertytypeId: Joi.number(),
      location: Joi.object({
        coordinates: Joi.string().required(),
        latitude: Joi.string(),
        longitude: Joi.string(),
        formatedAddress: Joi.string().required(),
        address: Joi.string().required(),
        country: Joi.string().required(),
        areaLevel1: Joi.string().required(),
        areaLevel2: Joi.string().required(),
        areaLevel3: Joi.string().required(),
        areaLevel4: Joi.string().allow('').optional(),
        areaLevel5: Joi.string().allow('').optional(),
      }).optional(),
    });
    const {error} = schema.validate(data);
    if (error) {
      throw new HttpErrors.BadRequest(error.message);
    } else {
      return;
    }
  }

  async create(data: Page & PageRelations, {currentUser}: {currentUser: UserProfile}): Promise<Page> {
    const transaction = await this.pageRepository.beginTransaction({
      isolationLevel: IsolationLevel.READ_COMMITTED,
      timeout: TRANSACTION_TIMEOUT,
    });
    try {
      this.validateCreatePage(data);
      const userId = parseInt(currentUser[securityId]);
      await this.locationsRepository.checkDublicateName(data.name);
      const pageData: Page = {
        ...omit(data, ['location', 'user']),
        userId,
        relatedUserId: 0,
        isActive: false,
      };
      if (data.avatarId) {
        pageData.avatarMedia = await this.mediaContentsRepository.findById(data.avatarId);
      } else {
        const mediaType = AvatarDefaultPage[`${data.type}`];
        const avatar = await this.mediaContentsRepository.findOne({
          where: {
            mediaType,
          },
          order: ['createdAt DESC', 'updatedAt DESC'],
        });
        if (avatar?.id) {
          pageData.avatarId = avatar?.id;
          pageData.avatarMedia = avatar;
        }
      }

      if (data.backgroundId) {
        pageData.backgroundMedia = await this.mediaContentsRepository.findById(data.backgroundId);
      } else {
        const mediaType = BgDefaultPage[`${data.type}`];
        const background = await this.mediaContentsRepository.findOne({
          where: {
            mediaType,
          },
          order: ['createdAt DESC', 'updatedAt DESC'],
        });
        if (background?.id) {
          pageData.backgroundId = background?.id;
          pageData.backgroundMedia = background;
        }
      }
      const userRelated = await this.createUserPage(pageData, {transaction});
      pageData.relatedUserId = userRelated.id || 0;

      let location = null;
      if (!pageData.locationId) {
        location = await this.locationsRepository.create(
          {
            ...data.location,
            userId,
            name: data.name,
            locationType: data.type,
            status: LocationStatusEnum.draft,
          },
          {transaction},
        );
        pageData.locationId = location.id || 0;
      } else {
        location = await this.locationsRepository.findById(pageData.locationId);
      }

      const result = await this.pageRepository.create(pageData, {transaction});
      await this.pageRepository.elasticService.updateById(
        {
          id: result?.id,
          type: result?.type,
          name: result?.name,
          address: location.address,
          userId: result.userId,
          createdAt: result?.createdAt,
          search: changeAlias(concatStringForElastic(result?.name, location.address)),
        },
        result.id,
      );

      await this.handleUpdatePageElasticSearch(result, {transaction});
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      return handleError(error);
    }
  }

  async find({
    currentUser,
    filter,
    searchParams,
  }: {
    currentUser: UserProfile;
    filter?: Filter<Page>;
    searchParams?: {
      q: string;
    };
  }): Promise<{
    count: number;
    data: PageWithRelations[];
  }> {
    const mustNot: AnyObject[] = [];
    const where = filter?.where || {};
    const matchs = Object.keys(where).map((item) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const object = where[String(item)];
      if (has(object, 'inq')) {
        return {
          bool: {
            should: object['inq'].map((value: string | number) => {
              return {
                match: {
                  [`page.${item}`]: value,
                },
              };
            }),
          },
        };
      }
      return {
        match: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          [`page.${item}`]: where[String(item)],
        },
      };
    });
    const must: AnyObject[] = [
      {
        match: {
          userTypeAccess: USER_TYPE_ACCESS_PAGE,
        },
      },
      ...matchs,
    ];
    const q = searchParams?.q;
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['name'],
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
      _source: ['id'],
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: must,
          must_not: mustNot,
        },
      },
    };
    const searchResult = await this.usersRepository.elasticService.get(body);
    if (!isEmpty(searchResult)) {
      const count = _.get(searchResult, 'body.hits.total.value', 0);
      const hit = getHit(searchResult);
      const userIds = Array.from(hit, (item: ElasticSearchResultHitInterface) => _.get(item, '_source.id')).filter(
        (item) => item,
      );
      const pages = await this.pageRepository.find({
        where: {
          relatedUserId: {
            inq: userIds,
          },
        },
      });
      const data = await Promise.all(pages.map((page) => this.findById(page.id || 0, currentUser)));
      return {
        count,
        data,
      };
    } else {
      return {
        count: 0,
        data: [],
      };
    }
  }

  async updateById(id: number, data: Partial<Page & PageRelations>, userId: number): Promise<{success: boolean}> {
    const transaction = await this.pageRepository.beginTransaction({
      isolationLevel: IsolationLevel.READ_COMMITTED,
      timeout: TRANSACTION_TIMEOUT,
    });
    try {
      const page = await this.pageRepository.findById(id);

      if (![page.userId, page.relatedUserId].includes(userId)) {
        return handleError(new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED));
      }

      const newLocation = data?.location ? data?.location : ({} as Locations);
      if (data.name) {
        newLocation.name = data.name;
      }

      if (!isEmpty(newLocation)) {
        const locationId = page.locationId;
        if (page.type === PageTypesEnum.tour.toString()) {
          await this.locationsRepository.updateById(
            locationId,
            {
              ...newLocation,
              status: LocationStatusEnum.draft,
            },
            {transaction},
          );
        } else {
          await this.locationsRepository.updateById(
            locationId,
            {
              ...newLocation,
            },
            {transaction},
          );
        }
      }

      const pageData: Partial<Page> = {
        ...omit(data, ['location', 'user']),
      };

      if (data.avatarId) {
        pageData.avatarMedia = await this.mediaContentsRepository.findById(data.avatarId);
      }

      if (data.backgroundId) {
        pageData.backgroundMedia = await this.mediaContentsRepository.findById(data.backgroundId);
      }
      if (!isEmpty(pageData)) {
        await this.pageRepository.updateById(
          id,
          {
            ...pageData,
          },
          {transaction},
        );
      }

      const afterPage = await this.pageRepository.findById(id, {}, {transaction});
      await this.handleUpdateUser(afterPage, {transaction});

      let location = {} as LocationsWithRelations;
      if (data.locationId) {
        location = await this.locationsRepository.findById(data.locationId);
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.pageRepository.elasticService.updateById(
        {
          name: pageData?.name,
          address: location?.address,
          createdAt: pageData?.createdAt,
          search: changeAlias(concatStringForElastic(pageData?.name, location?.address)),
        },
        id,
      );
      await this.handleUpdatePageElasticSearch(afterPage, {transaction});
      if (page.type === PageTypesEnum.stay.toString()) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        await this.serviceHandler.handleUpdateListStayElasticSearch(id);
      }
      await transaction.commit();
      return {success: true};
    } catch (error) {
      await transaction.rollback();
      return handleError(error);
    }
  }

  async myPages(
    {currentUser}: {currentUser: UserProfile},
    filter?: Filter<Page>,
  ): Promise<{
    tour: (Page & PageRelations)[];
    food: (Page & PageRelations)[];
    stay: (Page & PageRelations)[];
  }> {
    try {
      const userId = parseInt(currentUser[securityId]);
      const pages = await this.pageRepository.find({
        ...filter,
        where: {
          ...filter?.where,
          userId,
        },
        include: [
          {
            relation: 'location',
          },
        ],
        order: filter?.order || ['createdAt DESC'],
      });

      const newPage = await asyncLimiter(
        pages.map(async (page: Page & PageRelations) => {
          const notificationsCountNew: number = (
            await this.notificationRepository.count({
              userId: page.relatedUserId,
              pageId: page.id,
              read: false,
            })
          ).count;
          const conversationCountUnread: number = (
            await this.messagesHandlerController.getCountUnread({
              userId: page.relatedUserId,
            })
          ).count;

          return {...page, notificationsCountNew, conversationCountUnread};
        }),
      );

      return newPage.reduce(
        (
          accumulator: {
            food: (Page & PageRelations)[];
            stay: (Page & PageRelations)[];
            tour: (Page & PageRelations)[];
          },
          current: Page & PageRelations,
        ) => {
          const map = {
            [PageTypesEnum.food.toString()]: (item: Page & PageRelations) => {
              accumulator.food.push(item);
              return accumulator;
            },
            [PageTypesEnum.stay.toString()]: (item: Page & PageRelations) => {
              accumulator.stay.push(item);
              return accumulator;
            },
            [PageTypesEnum.tour.toString()]: (item: Page & PageRelations) => {
              accumulator.tour.push(item);
              return accumulator;
            },
          };

          return map[current.type](current);
        },
        {
          tour: [],
          food: [],
          stay: [],
        } as {
          tour: (Page & PageRelations)[];
          food: (Page & PageRelations)[];
          stay: (Page & PageRelations)[];
        },
      );
    } catch (error) {
      return handleError(error);
    }
  }

  async findById(id: number, currentUser: UserProfile): Promise<Page & PageRelations> {
    try {
      const userId = parseInt(currentUser[securityId]);
      const filter: FilterExcludingWhere<Page> = {
        include: [
          {
            relation: 'currency',
          },
          {
            relation: 'location',
          },
          {
            relation: 'avatar',
          },
          {
            relation: 'background',
          },
        ],
      };

      const result = await this.pageRepository.findById(id, filter);
      const totalNews = (
        await this.postsRepository.count({
          postType: POST_TYPE_PAGE,
          pageId: id,
          creatorId: result.relatedUserId,
        })
      ).count;
      const totalService = (
        await this.serviceRepository.count({
          pageId: id,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
        })
      ).count;
      const totalRanking = await this.rankingsRepository.count({
        locationId: result.locationId,
        rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
      });
      const isSavedLocation = await this.postLogicController.checkLocationHadSaveToMyMap({
        userId,
        locationId: result.locationId,
      });
      const accommodationTypes = await this.accommodationTypeRepository.find({
        fields: {
          id: true,
          name: true,
          pageId: true,
        },
        where: {
          pageId: id,
        },
      });
      const follow = await this.followRepository.findOne({
        where: {
          userId,
          followingId: result.relatedUserId,
        },
      });
      const totalFollower = (
        await this.followRepository.count({
          followingId: result.relatedUserId,
          followStatus: FOLLOW_STATUS_ACCEPTED,
        })
      ).count;
      let propertyType: PropertyType | null = null;
      if (result.stayPropertytypeId) {
        propertyType = await this.propertyTypeRepository.findById(result.stayPropertytypeId);
      }
      const pageReview = await this.pageReviewHandler.find(
        {
          where: {pageId: id},
        },
        currentUser,
      );
      const totalReview = pageReview.count;
      const averagePoint = pageReview.count ? Math.round(_.sumBy(pageReview.data, 'point') / pageReview.count) : 0;
      return {
        ...result,
        location: {
          ...result.location,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          totalRanking: totalRanking.count,
        },
        totalFollower,
        isSavedLocation,
        totalNews,
        totalService,
        followStatus: follow?.followStatus || '',
        generalInformation: !result.generalInformation
          ? undefined
          : {
              stay: {
                ...result.generalInformation.stay,
                accommodationTypes,
              },
              food: {
                ...result.generalInformation.food,
              },
            },
        ...(propertyType
          ? {
              propertyType,
            }
          : {}),
        myReview: await this.pageReviewHandler.findOne(
          {
            where: {pageId: id, createdById: userId},
          },
          currentUser,
        ),
        pageReview: {
          totalReview: totalReview,
          averagePoint: averagePoint,
        },
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async createPageNews(posts: Omit<Posts, 'id'>, userId: number, pageId: number): Promise<Posts> {
    let page: (Page & PageRelations) | null;
    try {
      page = await this.pageRepository.findOne({
        where: {
          id: pageId,
          userId,
        },
      });
      if (!page) {
        return handleError(new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED));
      }
      const newPost: Posts = {
        ...posts,
        postType: POST_TYPE_PAGE,
        pageId,
        creatorId: page.relatedUserId,
      };
      return await this.postLogicController.create(newPost);
    } catch (e) {
      return handleError(e);
    }
  }

  async updatePageNews(
    pageId: number,
    postId: number,
    userId: number,
    posts: Omit<Posts, 'id'>,
  ): Promise<{
    success: boolean;
  }> {
    let page: (Page & PageRelations) | null;
    try {
      page = await this.pageRepository.findOne({
        where: {
          id: pageId,
          relatedUserId: userId,
        },
      });
      if (!page) {
        return handleError(new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED));
      }
      const newPost = {
        ...posts,
        postType: POST_TYPE_PAGE,
        pageId,
        creatorId: page.relatedUserId,
      };
      await this.postLogicController.updatePostById(postId, newPost);
      return {
        success: true,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findPageNews(
    userId: number,
    pageId: number,
    filter?: Filter<Posts>,
  ): Promise<{
    count: number;
    data: FindPageNewsInterface[];
  }> {
    const page = await this.pageRepository.findById(pageId);
    const curstormFilter: Filter<Posts> = {
      ...filter,
      ...newsInfoQueryWithBookmark(userId),
      where: {
        ...filter?.where,
        ...newsInfoQueryWithBookmark(userId)?.where,
        pageId,
        postType: POST_TYPE_PAGE,
        ...(page.relatedUserId !== userId
          ? {
              accessType: POST_ACCESS_TYPE_PUBLIC,
            }
          : {}),
      },
    };
    const [result, count] = await Promise.all([
      this.postsRepository.find({
        ...curstormFilter,
      }),
      this.postsRepository.count(curstormFilter.where),
    ]);
    return {
      count: count.count,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      data: result.map((item) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const customPage: PageCovertForPostInterface = {
          ...item.page,
          profiles: {
            avatars: {
              mediaContents: item.page.avatar,
            },
          },
        };
        return {
          ...item,
          liked: !!(item.likes && item.likes.length),
          marked: !!(item.bookmarks && item.bookmarks.length),
          page: customPage,
        };
      }),
    };
  }

  async findPageNewsByNewsId({
    userId,
    filter,
    newsId,
    pageId,
  }: {
    userId: number;
    pageId: number;
    newsId: number;
    filter?: FilterExcludingWhere<Posts>;
  }): Promise<FindPageNewsInterface> {
    try {
      const page = await this.pageRepository.findById(pageId);
      const f: FilterExcludingWhere<Posts> = {
        ...filter,
        ...newsInfoQueryWithBookmark(userId),
      };
      const result = await this.postsRepository.findById(newsId, {
        ...f,
      });
      if (result.accessType !== POST_ACCESS_TYPE_PUBLIC && page.relatedUserId !== userId) {
        throw new HttpErrors.NotFound(ErrorCode.POST_NOT_AVAILABLE);
      }
      const customPage = {
        ...result.page,
        profiles: {
          avatars: {
            mediaContents: result.page.avatar,
          },
        },
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...result,
        liked: !!(result.likes && result.likes.length),
        marked: !!(result.bookmarks && result.bookmarks.length),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        page: customPage,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findPageServiceFood(
    userId: number,
    pageId: number,
    filter?: Filter<Service>,
  ): Promise<{
    count: number;
    data: FindPageServiceFoodInterface[];
  }> {
    const curstomFilter: Filter<Service> = {
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
      ...curstomFilter,
    });
    const count = await this.serviceRepository.count(curstomFilter.where);
    const dataPromise = result.map(async (item) => {
      const post = await this.postLogicController.findById({
        userId,
        id: item.postId,
      });
      return {
        ...item,
        attachments: post?.mediaContents,
        content: post?.content,
        post,
        liked: post?.liked,
        marked: post?.marked,
        rated: post?.rated,
      };
    });
    const data = await Promise.all(dataPromise);
    return {
      count: count.count,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      data,
    };
  }

  private async getPostWithRankingPointLocation(post: Posts): Promise<PageReviewResponseInterface> {
    try {
      const ranking = await this.rankingsRepository.findOne({
        where: {
          locationId: post.locationId,
          userId: post.creatorId,
        },
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...post,
        ranking: ranking || undefined,
        liked: Boolean(post.likes && post.likes.length),
        marked: Boolean(post.bookmarks && post.bookmarks.length),
        rated: Boolean(post.rankings && post.rankings.length),
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async createUserPage(data: (Page & PageRelations) | Partial<Page>, options?: AnyObject): Promise<UserPage> {
    try {
      const user = await this.usersRepository.createUser(
        {
          name: data.name,
          username: convertNameToUserNameUnique(data.name),
          isActive: true,
          userTypeAccess: USER_TYPE_ACCESS_PAGE,
          roles: USER_ROLE_NORMAL_USER,
        },
        options,
      );

      const profile = await this.profilesRepository.createProfile(
        {
          userId: user.id,
        },
        options,
      );

      if (data.avatarId) {
        await this.avatarsRepository.create(
          {
            profileId: profile.id,
            mediaContentId: data.avatarId,
          },
          options,
        );
      }

      if (data.backgroundId) {
        await this.backgroundsRepository.create(
          {
            profileId: profile.id,
            mediaContentId: data.backgroundId,
          },
          options,
        );
      }

      return {
        ...user,
        avatarId: data.avatarId,
        backgroundId: data.backgroundId,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async handleUpdateUser(page: Partial<Page>, options?: AnyObject): Promise<void> {
    //console.log(options);
    try {
      if (!page?.id) {
        return handleError(new HttpErrors.BadRequest(ErrorCode.INVALID_PAGE_ID));
      }
      if (page.relatedUserId) {
        await this.usersRepository.updateById(
          page.relatedUserId,
          {
            name: page.name,
          },
          options,
        );
        const profile = await this.profilesRepository.findOne(
          {
            where: {
              userId: page.relatedUserId,
            },
          },
          options,
        );
        if (profile?.id && page.avatarId) {
          const avatar = await this.avatarsRepository.findOne(
            {
              where: {
                profileId: profile?.id,
              },
            },
            options,
          );
          if (avatar) {
            await this.avatarsRepository.updateAll(
              {
                mediaContentId: page.avatarId,
              },
              {
                profileId: profile?.id,
              },
              options,
            );
          } else {
            await this.avatarsRepository.create(
              {
                mediaContentId: page.avatarId,
                profileId: profile?.id,
              },
              options,
            );
          }
        }
        if (profile?.id && page.backgroundId) {
          const bg = await this.backgroundsRepository.findOne(
            {
              where: {
                profileId: profile?.id,
              },
            },
            options,
          );
          if (bg) {
            await this.backgroundsRepository.updateAll(
              {
                mediaContentId: page.backgroundId,
              },
              {
                profileId: profile?.id,
              },
              options,
            );
          } else {
            await this.backgroundsRepository.create(
              {
                mediaContentId: page.backgroundId,
                profileId: profile?.id,
              },
              options,
            );
          }
          await this.backgroundsRepository.updateAll(
            {
              mediaContentId: page.backgroundId,
            },
            {
              profileId: profile?.id,
            },
            options,
          );
        }
      } else {
        const pageData: Partial<Page> = {
          name: page.name || '',
          avatarId: page.avatarId,
          backgroundId: page.backgroundId,
          relatedUserId: 0,
        };
        if (page.avatarId) {
          pageData.avatarMedia = await this.mediaContentsRepository.findById(page.avatarId);
        }

        if (page.backgroundId) {
          pageData.backgroundMedia = await this.mediaContentsRepository.findById(page.backgroundId);
        } else {
          const mediaType = BgDefaultPage[`${page.type}`];
          const background = await this.mediaContentsRepository.findOne({
            where: {
              mediaType,
            },
            order: ['createdAt DESC', 'updatedAt DESC'],
          });
          if (background?.id) {
            pageData.backgroundId = background?.id;
          }
        }
        const userRelated = await this.createUserPage(page, options);
        pageData.relatedUserId = userRelated?.id || 0;
        await this.pageRepository.updateById(
          page.id,
          {
            ...pageData,
          },
          options,
        );
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async requestVerifyPage(
    pageId: number,
    {
      personalMediaIds,
      enterpriseMediaIds,
      identityType,
      identityCode,
      fullName,
      nationality,
      businessType,
      enterpriseName,
    }: {
      personalMediaIds?: number[];
      enterpriseMediaIds?: number[];
      identityType?: string;
      identityCode?: string;
      fullName: string;
      nationality?: string;
      businessType?: string;
      enterpriseName?: string;
    },
    currentUser: UserProfile,
  ): Promise<{
    message: string;
  }> {
    try {
      const currentUserId = parseInt(currentUser[securityId]);
      await this.pageRepository.validatePermissionModifyPage(pageId, currentUserId);
      const currentVerify = await this.pageVerificationRepository.findOne({
        where: {
          pageId,
        },
      });
      if (currentVerify) {
        await this.pageVerificationRepository.replaceById(currentVerify.id, {
          ...currentVerify,
          personalMediaIds: personalMediaIds || [],
          enterpriseMediaIds: enterpriseMediaIds || [],
          identityType,
          identityCode,
          pageId,
          fullName,
          nationality: nationality || '',
          enterpriseName: enterpriseName || '',
          status: VerifyPageStatus.REQUESTED,
        });
      } else {
        await this.pageVerificationRepository.create({
          personalMediaIds: personalMediaIds || [],
          enterpriseMediaIds: enterpriseMediaIds || [],
          identityType,
          identityCode,
          pageId,
          fullName,
          nationality: nationality || '',
          enterpriseName: enterpriseName || '',
          status: VerifyPageStatus.REQUESTED,
        });
      }
      await this.pageRepository.updateById(pageId, {
        businessType,
        isOfficial: false,
      });

      return {
        message: 'successful',
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async handleUpdatePageElasticSearch(page: Page, options?: AnyObject): Promise<void> {
    const pageES = omit(page, 'backgroundMedia', 'avatarMedia');
    await this.usersRepository.updateElastic(
      page.relatedUserId,
      {
        page: pageES,
      },
      options,
    );
  }

  async checkExist(
    name: string,
  ): Promise<{
    isExist: boolean;
  }> {
    const result = await this.pageRepository.findOne({
      where: {
        name,
      },
    });
    return {
      isExist: Boolean(result),
    };
  }

  async findPageVerifications(
    filter?: Filter<PageVerification>,
  ): Promise<{count: number; data: Partial<PageVerificationWithRelations>[]}> {
    try {
      const [count, pageVerifications] = await Promise.all([
        this.pageVerificationRepository.count(filter?.where),
        this.pageVerificationRepository.find(filter),
      ]);

      const promises = pageVerifications.map(
        async (item): Promise<Partial<PageVerificationWithRelations>> => {
          const personalMediaIds = item.personalMediaIds || [];
          const personalMediaContents = personalMediaIds.length
            ? await this.mediaContentsRepository.find({
                where: {id: {inq: personalMediaIds}},
              })
            : [];
          const enterpriseMediaIds = item.enterpriseMediaIds || [];
          const enterpriseMediaContents = enterpriseMediaIds.length
            ? await this.mediaContentsRepository.find({
                where: {id: {inq: enterpriseMediaIds}},
              })
            : [];

          return {...item, personalMediaContents, enterpriseMediaContents};
        },
      );

      const data = await Promise.all(promises);

      return {data, count: count.count};
    } catch (error) {
      return handleError(error);
    }
  }

  async findPageVerificationById(userRelatedPageId: number): Promise<Partial<PageVerificationWithRelations> | null> {
    try {
      const page = await this.pageRepository.findOne({
        where: {
          relatedUserId: userRelatedPageId,
        },
      });
      if (!page) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
      const pageVerifications = await this.pageVerificationRepository.findOne({
        where: {
          pageId: page?.id,
        },
      });
      if (!pageVerifications) {
        return pageVerifications;
      }
      const personalMediaIds = pageVerifications.personalMediaIds || [];
      const personalMediaContents = personalMediaIds.length
        ? await this.mediaContentsRepository.find({
            where: {id: {inq: personalMediaIds}},
          })
        : [];
      const enterpriseMediaIds = pageVerifications.enterpriseMediaIds || [];
      const enterpriseMediaContents = enterpriseMediaIds.length
        ? await this.mediaContentsRepository.find({
            where: {id: {inq: enterpriseMediaIds}},
          })
        : [];

      return {
        ...pageVerifications,
        personalMediaContents,
        enterpriseMediaContents,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async updateStayGeneralInformation(
    pageId: number,
    data: UpdateStayGeneralInfomationInterface,
    currentUser: UserProfile,
  ): Promise<void> {
    try {
      const currentUserId = parseInt(currentUser[securityId]);
      const page = await this.pageRepository.findById(pageId);
      if (page.userId !== currentUserId && page.relatedUserId !== currentUserId) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }

      await this.pageRepository.updateById(pageId, {
        currencyId: data.currencyId,
        stayPropertytypeId: data.stayPropertytypeId,
        generalInformation: {
          ...data.generalInformation,
          stay: omit(data.generalInformation.stay, ['accommodationTypes']),
        },
      });
      /*
        delete accommodationTypes
       */
      const accomTypesCurrent = await this.accommodationTypeRepository.find({
        where: {
          pageId,
        },
      });
      const {accommodationTypes} = data.generalInformation.stay;
      const existIds = accommodationTypes.map((item) => item.id).filter((item) => item);
      await asyncLimiter(
        accomTypesCurrent.map(async (item) => {
          const isExist = await this.accommodationTypeRepository.exists(item.id);
          if (!existIds.includes(item.id) && isExist) {
            await this.accommodationTypeRepository.deleteById(item.id);
          }
        }),
      );
      await asyncLimiter(
        accommodationTypes.map(async (item) => {
          if (item.id) {
            const isExist = await this.accommodationTypeRepository.exists(item.id);
            if (isExist) {
              return this.accommodationTypeRepository.updateById(item.id, {
                name: item.name,
              });
            }
            return null;
          }
          return this.accommodationTypeRepository.create({
            name: item.name,
            pageId,
          });
        }),
      );
    } catch (error) {
      return handleError(error);
    }
  }

  async updateFoodGeneralInformation(
    pageId: number,
    data: UpdateFoodGeneralInfomationInterface,
    currentUser: UserProfile,
  ): Promise<void> {
    try {
      const currentUserId = parseInt(currentUser[securityId]);
      const page = await this.pageRepository.findById(pageId);
      if (page.relatedUserId !== currentUserId) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
      const [minPriceFood, dataLocation] = await Promise.all([
        this.serviceRepository.findOne({
          order: ['price ASC'],
          where: {
            pageId: page.id,
            type: ServiceTypesEnum.food.toString(),
          },
        }),
        this.locationsRepository.findById(page.locationId),
        this.pageRepository.updateById(pageId, {
          generalInformation: {
            food: {
              ...page.generalInformation?.food,
              ...data.generalInformation.food,
            },
          },
        }),
      ]);
      dataLocation &&
        (await this.locationsRepository.updateById(
          page.locationId,
          {
            isPublished: minPriceFood?.price ? true : false,
          },
          {
            price: minPriceFood?.price,
            ...(data.generalInformation.food.typeOfRestaurant
              ? {
                  typeOfRestaurant: data.generalInformation.food.typeOfRestaurant,
                }
              : {}),
          },
        ));
    } catch (error) {
      return handleError(error);
    }
  }

  async findAccommodationTypes(
    pageId: number,
    filter: Filter<AnyObject>,
    currentUser: UserProfile,
    stayFilterSearch?: {
      checkoutDate?: string;
      checkinDate?: string;
    },
    filterService?: Filter<Stay>,
  ): Promise<{count: number; data: Partial<AccommodationTypeWithRelations>[]}> {
    try {
      const accommodationTypes = await this.accommodationTypeRepository.find(omit(filter, ['limit', 'offset']));

      const promises = accommodationTypes.map(
        async (item): Promise<Partial<AccommodationTypeWithRelations> | undefined> => {
          return this.serviceHandler.findAvailableStayByAccommodationType(
            pageId,
            item,
            currentUser,
            stayFilterSearch,
            filterService,
          );
        },
      );

      const data = compact(await Promise.all(promises));

      return {count: data.length, data};
    } catch (error) {
      return handleError(error);
    }
  }

  async findListStayGroupbyAccommodationType(
    pageId: number,
    filter: Filter<AccommodationType>,
    currentUser: UserProfile,
  ): Promise<{count: number; data: Partial<AccommodationTypeWithRelations>[]}> {
    try {
      const accommodationTypes = await this.accommodationTypeRepository.find(omit(filter, ['limit', 'offset']));

      const promises = accommodationTypes.map(
        async (item): Promise<Partial<AccommodationTypeWithRelations> | undefined> => {
          return this.serviceHandler.findStayByAccommodationType(pageId, item, currentUser);
        },
      );

      const data = compact(await Promise.all(promises));

      return {count: data.length, data};
    } catch (error) {
      return handleError(error);
    }
  }
}

export function newsInfoQueryWithBookmark(userId: number): Filter<Posts> {
  return {
    include: [
      {
        relation: 'mediaContents',
      },
      {
        relation: 'page',
        scope: {
          include: [
            {
              relation: 'avatar',
            },
          ],
        },
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
      {
        relation: 'creator',
        scope: {
          include: [
            {
              relation: 'profiles',
              scope: {
                include: [
                  {
                    relation: 'avatars',
                    scope: {
                      include: [
                        {
                          relation: 'mediaContent',
                        },
                      ],
                    },
                  },
                  {
                    relation: 'backgrounds',
                    scope: {
                      include: [
                        {
                          relation: 'mediaContent',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}
