import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {inject} from '@loopback/context';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';

import {
  AccommodationType,
  AccommodationTypeWithRelations,
  Currency,
  Locations,
  MediaContents,
  ModelFilterStayClass,
  Page,
  PageRelations,
  PageVerification,
  PageVerificationWithRelations,
  PageWithRelations,
  Posts,
  PropertyType,
  Service,
  Stay,
  StayGeneralInformation,
} from '../../models';
import {PageRepository, PostsRepository} from '../../repositories';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {PageHandler} from './page.handler';
import {AUTHORIZE_CUSTOMER, AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {FindPageNewsInterface, FindPageServiceFoodInterface} from './page.interface';
import {userInfoSchema} from '../specs/user-controller.specs';
import {handleError} from '../../utils/handleError';
import {filters} from '../../utils/Filter';
import {
  EnumIdentityType,
  PageBusinessTypeEnum,
  UpdateFoodGeneralInfomationInterface,
  UpdateStayGeneralInfomationInterface,
} from './page.constant';
import {schemaResponseStayDetail, ServiceDetailResponseInterface} from '../services/service.constant';
import {ServiceStatusEnum, ServiceTypesEnum} from '../../configs/service-constant';
import {ServiceHandler} from '../services/service.handler';
import {pageReviewSchema} from '../page-review/page-review.constant';

export class PageController {
  constructor(
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @inject(HandlerBindingKeys.PAGE_HANDLER) public pageHandler: PageHandler,
    @inject(HandlerBindingKeys.SERVICE_HANDLER)
    public serviceHandler: ServiceHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/pages', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Page model instance',
        content: {'application/json': {schema: getModelSchemaRef(Page)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              ...getModelSchemaRef(Page, {
                title: 'NewPage',
                exclude: [
                  'id',
                  'userId',
                  'createdAt',
                  'updatedAt',
                  'isActive',
                  'deletedAt',
                  'backgroundMedia',
                  'avatarMedia',
                  'relatedUserId',
                  'generalInformation',
                ],
              }).definitions.NewPage.properties,
              location: {
                type: 'object',
                additionalProperties: false,
                properties: getModelSchemaRef(Locations, {
                  title: 'NewLocationPage',
                  exclude: [
                    'id',
                    'totalReview',
                    'averagePoint',
                    'createdAt',
                    'updatedAt',
                    'deletedAt',
                    'userId',
                    'locationType',
                    'name',
                    'status',
                  ],
                }).definitions.NewLocationPage.properties,
                required: [
                  'coordinates',
                  'country',
                  'areaLevel1',
                  'areaLevel2',
                  'areaLevel3',
                  'formatedAddress',
                  'address',
                ],
              },
            },
            required: ['name', 'type', 'email', 'phone'],
          },
        },
      },
    })
    page: Page & PageRelations,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Page> {
    return this.pageHandler.create(page, {currentUser});
  }

  @post('/pages/check_exist', {
    responses: {
      '200': {
        description: 'Check Exist page by page name',
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
            title: 'CheckExistPage',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    page: {
      name: string;
    },
  ): Promise<{
    isExist: boolean;
  }> {
    return this.pageHandler.checkExist(page.name).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/page/{pageId}/verify', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Send Verify Page request instance',
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
  async createVerifyPage(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'bodyVerifyPage',
            additionalProperties: false,
            properties: {
              personalMediaIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
              enterpriseMediaIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
              enterpriseName: {
                type: 'string',
              },
              identityType: {
                type: 'string',
                enum: [EnumIdentityType.IDENTITY_CARD, EnumIdentityType.PASSPORT, EnumIdentityType.LICENSE],
              },
              identityCode: {
                type: 'string',
              },
              fullName: {
                type: 'string',
              },
              nationality: {
                type: 'string',
              },
              businessType: {
                type: 'string',
                enum: [PageBusinessTypeEnum.ENTERPRISE.toString(), PageBusinessTypeEnum.PERSONAL.toString()],
              },
            },
            required: ['fullName'],
          },
        },
      },
    })
    body: {
      personalMediaIds: number[];
      enterpriseMediaIds?: number[];
      identityType?: string;
      identityCode?: string;
      fullName: string;
      nationality?: string;
      businessType?: string;
      enterpriseName?: string;
    },
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('pageId') pageId: number,
  ): Promise<{
    message: string;
  }> {
    return this.pageHandler.requestVerifyPage(pageId, body, currentUser);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/pages/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Page PATCH success',
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
  async update(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdatePageById',
            properties: {
              ...getModelSchemaRef(Page, {
                title: 'updatePage',
                exclude: ['id', 'userId', 'createdAt', 'updatedAt', 'isActive', 'deletedAt'],
              }).definitions.updatePage.properties,
              location: {
                type: 'object',
                properties: getModelSchemaRef(Locations, {
                  title: 'updateLocationPage',
                  exclude: [
                    'id',
                    'totalReview',
                    'averagePoint',
                    'createdAt',
                    'updatedAt',
                    'userId',
                    'locationType',
                    'name',
                    'status',
                  ],
                }).definitions.updateLocationPage.properties,
              },
            },
          },
        },
      },
    })
    page: Page & PageRelations,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<{success: boolean}> {
    const userId = parseInt(currentUser[securityId]);

    return this.pageHandler.updateById(id, page, userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/pages/mine', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of My Page model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                tour: {
                  type: 'array',
                  items: getModelSchemaRef(Page),
                },
                food: {
                  type: 'array',
                  items: getModelSchemaRef(Page),
                },
                stay: {
                  type: 'array',
                  items: getModelSchemaRef(Page),
                },
              },
            },
          },
        },
      },
    },
  })
  async myPages(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(Page, {name: 'filterPageMine'}) filter?: Filter<Page>,
  ): Promise<{
    tour: (Page & PageRelations)[];
    food: (Page & PageRelations)[];
    stay: (Page & PageRelations)[];
  }> {
    return this.pageHandler.myPages({currentUser}, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/pages/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Page model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Page, {
                  title: 'DetailPage',
                  exclude: ['generalInformation'],
                }).definitions.DetailPage.properties,
                generalInformation: {
                  type: 'object',
                  properties: {
                    stay: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(StayGeneralInformation, {
                          title: 'PoststayGeneralInformation',
                        }).definitions['PoststayGeneralInformation'].properties,
                        accommodationTypes: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(AccommodationType).definitions.AccommodationType.properties,
                            },
                          },
                        },
                        currency: getModelSchemaRef(Currency),
                      },
                    },
                    food: {
                      type: 'object',
                      properties: {
                        typeOfRestaurant: {
                          type: 'string',
                        },
                        businessHours: {
                          type: 'object',
                          properties: {
                            open247: {
                              type: 'boolean',
                            },
                            from: {
                              type: 'string',
                            },
                            to: {
                              type: 'string',
                            },
                          },
                        },
                        menu: {
                          type: 'array',
                          items: getModelSchemaRef(MediaContents),
                        },
                        view: {
                          type: 'array',
                          items: getModelSchemaRef(MediaContents),
                        },
                      },
                    },
                  },
                },
                location: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Locations).definitions.Locations.properties,
                    totalRanking: {
                      type: 'number',
                    },
                  },
                },
                verifyStatus: {
                  type: 'string',
                },
                isSavedLocation: {
                  type: 'boolean',
                },
                avatar: getModelSchemaRef(MediaContents),
                background: getModelSchemaRef(MediaContents),
                totalNews: {
                  type: 'number',
                },
                totalService: {
                  type: 'number',
                },
                followStatus: {
                  type: 'string',
                },
                totalFollower: {
                  type: 'number',
                },
                propertyType: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(PropertyType).definitions.PropertyType.properties,
                  },
                },
                currency: getModelSchemaRef(Currency),
                myReview: pageReviewSchema(),
                pageReview: {
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
              },
            },
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Page> {
    return this.pageHandler.findById(id, currentUser);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/pages', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Page model instance',
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
                      ...getModelSchemaRef(Page, {title: 'DetailPage'}).definitions.DetailPage.properties,
                      location: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Locations).definitions.Locations.properties,
                          totalRanking: {
                            type: 'number',
                          },
                        },
                      },
                      verifyStatus: {
                        type: 'string',
                      },
                      isSavedLocation: {
                        type: 'boolean',
                      },
                      avatar: getModelSchemaRef(MediaContents),
                      background: getModelSchemaRef(MediaContents),
                      totalNews: {
                        type: 'number',
                      },
                      totalService: {
                        type: 'number',
                      },
                      totalReview: {
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
  async find(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param({
      name: 'pageSearch',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    pageSearch?: {
      q: string;
    },
    @param.filter(Page, {name: 'filterPages'}) filter?: Filter<Page>,
  ): Promise<{
    count: number;
    data: PageWithRelations[];
  }> {
    return this.pageHandler.find({
      currentUser,
      filter,
      searchParams: pageSearch,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/page/{pageId}/news', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Posts model instance',
        content: {'application/json': {schema: getModelSchemaRef(Posts)}},
      },
    },
  })
  async createPageNews(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'postNews',
            type: 'object',
            properties: {
              ...getModelSchemaRef(Posts, {
                title: 'postNewPost',
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
                  'isPublicLocation',
                  'creatorId',
                  'locationId',
                  'sourcePostId',
                  'pageId',
                  'medias',
                ],
              }).definitions['postNewPost'].properties,
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  title: 'mediaContentPosts',
                }),
              },
            },
          },
        },
      },
    })
    posts: Omit<Posts, 'id'>,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('pageId') pageId: number,
  ): Promise<Posts> {
    const userId = parseInt(userProfile[securityId]);
    return this.pageHandler.createPageNews(posts, userId, pageId).catch((e) => {
      throw e;
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @patch('/page/{pageId}/news/{newsId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Posts model instance',
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
  async updatePageNews(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'postNewsUpdate',
            type: 'object',
            properties: {
              ...getModelSchemaRef(Posts, {
                title: 'postNewPost',
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
                  'isPublicLocation',
                  'creatorId',
                  'locationId',
                  'sourcePostId',
                  'pageId',
                  'medias',
                ],
              }).definitions['postNewPost'].properties,
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  title: 'mediaContentPosts',
                }),
              },
            },
          },
        },
      },
    })
    posts: Omit<Posts, 'id'>,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('pageId') pageId: number,
    @param.path.number('newsId') newsId: number,
  ): Promise<{
    success: boolean;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.pageHandler.updatePageNews(pageId, newsId, userId, posts).catch((e) => {
      throw e;
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/page/{pageId}/news', {
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
                  items: newsInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async findPageNews(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('pageId') pageId: number,
    @param.filter(Posts, {name: 'filterPagesNews'}) filter?: Filter<Posts>,
  ): Promise<{
    count: number;
    data: FindPageNewsInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.pageHandler.findPageNews(userId, pageId, filter).catch((e) => {
      throw e;
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/page/{pageId}/news/{newsId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Page News model instances',
        content: {
          'application/json': {
            schema: newsInfoSchema(),
          },
        },
      },
    },
  })
  async findPageNewsByNewsId(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('pageId') pageId: number,
    @param.path.number('newsId') newsId: number,
    @param.filter(Posts, {name: 'filterPagesNewsByNewsId'})
    filter?: FilterExcludingWhere<Posts>,
  ): Promise<FindPageNewsInterface> {
    const userId = parseInt(userProfile[securityId]);
    return this.pageHandler.findPageNewsByNewsId({userId, pageId, filter, newsId}).catch((e) => {
      throw e;
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/page/{pageId}/services/food', {
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
                      currency: getModelSchemaRef(Currency),
                      post: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Posts).definitions.Posts.properties,
                          liked: {
                            type: 'boolean',
                          },
                          rated: {
                            type: 'boolean',
                          },
                          marked: {
                            type: 'boolean',
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
  async findPageServiceFood(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('pageId') pageId: number,
    @param.filter(Service, {name: 'filterPagesServiceFood'})
    filter?: Filter<Service>,
  ): Promise<{
    count: number;
    data: FindPageServiceFoodInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.pageHandler.findPageServiceFood(userId, pageId, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page/verifications', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Get Detail Page Verifications instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(PageVerification, {
                  title: 'detailpageVerification',
                }).definitions['detailpageVerification'].properties,
                personalMediaContents: {
                  type: 'array',
                  items: getModelSchemaRef(MediaContents, {
                    title: 'DetailPersonalMediaContents',
                  }),
                },
                enterpriseMediaContents: {
                  type: 'array',
                  items: getModelSchemaRef(MediaContents, {
                    title: 'DetailEnterpriseMediaContents',
                  }),
                },
              },
            },
          },
        },
      },
    },
  })
  async findPageVerificationById(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Partial<PageVerificationWithRelations> | null> {
    const userId = parseInt(currentUser[securityId]);
    return this.pageHandler.findPageVerificationById(userId);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/page/{id}/stay/general-information', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Update general information success',
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
  async updateStayGeneralInformation(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'updateStayGeneralInformation',
            type: 'object',
            properties: {
              stayPropertytypeId: {
                type: 'number',
              },
              currencyId: {
                type: 'number',
              },
              generalInformation: {
                type: 'object',
                properties: {
                  stay: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(StayGeneralInformation, {
                        title: 'PostStayGeneralInformation',
                      }).definitions['PostStayGeneralInformation'].properties,
                      accommodationTypes: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(AccommodationType).definitions.AccommodationType.properties,
                          },
                        },
                      },
                    },
                    required: [
                      'bookingType',
                      'rentalType',
                      'cancellationPolicy',
                      'checkinTime',
                      'checkoutTime',
                      'checkinMethod',
                      'checkoutGuide',
                      'convenientUserGuide',
                      'language',
                      'payMethod',
                      'accommodationTypes',
                    ],
                  },
                },
                required: ['stay'],
              },
            },
            required: ['stayPropertytypeId', 'generalInformation', 'currencyId'],
          },
        },
      },
    })
    data: UpdateStayGeneralInfomationInterface,
  ): Promise<{
    success: boolean;
  }> {
    await this.pageHandler.updateStayGeneralInformation(id, data, currentUser);
    return {
      success: true,
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/page/{id}/food/general-information', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Update general information success',
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
  async updateFoodGeneralInformation(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'updateFoodGeneralInformation',
            type: 'object',
            properties: {
              generalInformation: {
                type: 'object',
                properties: {
                  food: {
                    type: 'object',
                    properties: {
                      typeOfRestaurant: {
                        type: 'string',
                      },
                      businessHours: {
                        type: 'object',
                        properties: {
                          open247: {
                            type: 'boolean',
                          },
                          from: {
                            type: 'string',
                          },
                          to: {
                            type: 'string',
                          },
                        },
                      },
                      menu: {
                        type: 'array',
                        items: getModelSchemaRef(MediaContents),
                      },
                      view: {
                        type: 'array',
                        items: getModelSchemaRef(MediaContents),
                      },
                    },
                    required: ['typeOfRestaurant', 'businessHours', 'menu', 'view'],
                  },
                },
                required: ['food'],
              },
            },
            required: ['generalInformation'],
          },
        },
      },
    })
    data: UpdateFoodGeneralInfomationInterface,
  ): Promise<{
    success: boolean;
  }> {
    await this.pageHandler.updateFoodGeneralInformation(id, data, currentUser);
    return {
      success: true,
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page/{id}/accommodation-types/stay', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Stay group by accommodation-types',
        content: {
          'application/json': {
            schema: {
              title: 'PageAccommodationTypes',
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'DataPageAccommodationTypes',
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(AccommodationType).definitions.AccommodationType.properties,
                      stays: {
                        type: 'array',
                        items: schemaResponseStayDetail('StayServicesTypes'),
                      },
                      total: {
                        type: 'number',
                      },
                      numOfAvailable: {
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
  async findStay(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @param({
      name: 'pageDateRangeSearch',
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
    stayFilterSearch?: {
      checkoutDate?: string;
      checkinDate?: string;
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    @param.where(ModelFilterStayClass, 'whereStay')
    where?: Where<ModelFilterStayClass>,
    @param.filter(AccommodationType, {name: 'filterAccommodationType'})
    filter?: Filter<AccommodationType>,
    @param.filter(Stay, {name: 'filterStayOptionAccommo'})
    filterStay?: Filter<Stay>,
  ): Promise<{count: number; data: Partial<AccommodationTypeWithRelations>[]}> {
    const newFilter = {
      ...filters(filter),
      where: {
        ...filters(filter).where,
        pageId: id,
      },
    };
    return this.pageHandler.findAccommodationTypes(id, newFilter, currentUser, stayFilterSearch, filterStay);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page/{id}/accommodation-types/stays', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Stay list group by accommodation-types',
        content: {
          'application/json': {
            schema: {
              title: 'PageAccommodationTypesStays',
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'DataPageAccommodationTypesStays',
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(AccommodationType).definitions.AccommodationType.properties,
                      stays: {
                        type: 'array',
                        items: schemaResponseStayDetail('StayServicesTypesList'),
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
  async findListStayGroupbyAccommodationType(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(AccommodationType, {
      name: 'filterStayGroupbyAccommodationType',
    })
    filter?: Filter<AccommodationType>,
  ): Promise<{count: number; data: Partial<AccommodationTypeWithRelations>[]}> {
    const newFilter = {
      ...filters(filter),
      where: {
        ...filters(filter).where,
        pageId: id,
      },
    };
    return this.pageHandler.findListStayGroupbyAccommodationType(id, newFilter, currentUser);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page/{id}/services/stay', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Service Stay model instance',
        content: {
          'application/json': {
            schema: {
              title: 'ListStayServicesInPage',
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  title: 'ListStayServices',
                  type: 'array',
                  items: schemaResponseStayDetail('StayServicesInPage'),
                },
              },
            },
          },
        },
      },
    },
  })
  async findServiceStayByPageId(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(Service, {name: 'filterStayService'})
    filter?: Filter<Service>,
  ): Promise<{count: number; data: ServiceDetailResponseInterface[]}> {
    const newFilter: Filter<Service> = {
      ...filters(filter),
      where: {
        ...filters(filter).where,
        pageId: id,
        type: ServiceTypesEnum.stay.toString(),
        status: ServiceStatusEnum.public,
      },
    };
    return this.serviceHandler.findServiceStay(newFilter, currentUser);
  }
}

export function newsInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Posts, {
        exclude: ['listUsersReceiveNotifications'],
        title: 'contentNews',
      }).definitions.contentNews.properties,
      mediaContents: {
        type: 'array',
        items: getModelSchemaRef(MediaContents),
      },
      creator: userInfoSchema(),
      page: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Page, {title: 'DetailPage'}).definitions.DetailPage.properties,
          location: getModelSchemaRef(Locations),
          profiles: {
            type: 'object',
            properties: {
              avatars: {
                type: 'object',
                properties: {
                  mediaContents: getModelSchemaRef(MediaContents),
                },
              },
            },
          },
        },
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
    },
  };
}

export function serviceInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Posts, {
        exclude: ['listUsersReceiveNotifications'],
        title: 'contentNews',
      }).definitions.contentNews.properties,
      mediaContents: {
        type: 'array',
        items: getModelSchemaRef(MediaContents),
      },
      page: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Page, {title: 'DetailPage'}).definitions.DetailPage.properties,
          location: getModelSchemaRef(Locations),
          profiles: {
            type: 'object',
            properties: {
              avatars: {
                type: 'object',
                properties: {
                  mediaContents: getModelSchemaRef(MediaContents),
                },
              },
            },
          },
        },
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
    },
  };
}
