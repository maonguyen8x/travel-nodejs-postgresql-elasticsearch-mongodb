import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  post,
  put,
  requestBody,
  patch,
  getWhereSchemaFor,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {groupBy, keys} from 'lodash';
import moment from 'moment';
import {
  POST_SEARCH_MODES,
  POST_TYPE_CREATED,
  SEARCH_TYPE_COMMUNITY,
  POST_ACCESS_TYPES,
  POST_TYPE_SHARE_PLAN,
  POST_TYPE_SHARED,
} from '../../configs/post-constants';
import {MediaContents, Posts} from '../../models';
import {PostsRepository} from '../../repositories';
import {changeAlias} from '../../utils/handleString';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {AUTHORIZE_CUSTOMER, AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {PostsHandler} from './posts.handler';
import {isEmpty} from 'lodash';
import {UsersBlockHandler} from '../user-block/users-block.handler';
import {PostDataWithFlagInterface} from './post.contant';
import {ErrorCode} from '../../constants/error.constant';
import {PlanLogicController} from '../plan/plan-logic.controller';
import {PostLogicController} from './post-logic.controller';
import {UserLogicController} from '../user/user-logic.controller';
import {postInfoQueryWithBookmark, postInfoSchema} from './post.schema';

export class PostsController {
  constructor(
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
    @inject('controllers.UserLogicController')
    public userLogicController: UserLogicController,
    @inject(HandlerBindingKeys.POSTS_HANDLER)
    public postsHandler: PostsHandler,
    @inject(HandlerBindingKeys.USERS_BLOCK_HANDLER)
    public usersBlockHandler: UsersBlockHandler,
    @inject('controllers.PlanLogicController')
    public planLogicController: PlanLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/posts', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Posts model instance',
        content: {'application/json': {schema: getModelSchemaRef(Posts)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'NewPost',
            type: 'object',
            properties: {
              ...getModelSchemaRef(Posts, {
                title: 'newPost',
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
                  'pageId',
                  'medias',
                  'deletedAt',
                ],
              }).definitions['newPost'].properties,
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  title: 'mediaContentPosts',
                  exclude: ['postId', 'deletedAt'],
                }),
              },
            },
          },
        },
      },
    })
    posts: Omit<Posts, 'id'>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Posts> {
    if (!posts.mediaContents && posts.locationId) {
      throw new HttpErrors.BadRequest(ErrorCode.POST_MUST_ATTACH_PHOTOS_OR_VIDEOS);
    }
    if (!posts?.mediaContents?.length && !posts?.backgroundPost) {
      throw new HttpErrors.BadRequest(ErrorCode.POST_MUST_ATTACH_MEDIA_OR_HAD_BACKGROUND);
    }
    const userId = parseInt(currentUserProfile[securityId]);
    const newPost = {
      ...posts,
      creatorId: userId,
      postType: POST_TYPE_CREATED,
    };
    return this.postLogicController.create(newPost).catch((e) => {
      throw e;
    });
  }

  // @authenticate('jwt')
  @get('/posts/count', {
    // security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Posts model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Posts) where?: Where<Posts>): Promise<Count> {
    return this.postsRepository.count(where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/posts', {
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
                  items: postInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(Posts, {name: 'filterPosts'}) filter?: Filter<Posts>,
  ): Promise<{
    count: number;
    data: PostDataWithFlagInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.postLogicController.find({
      userId,
      filter,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/posts/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Posts model instance',
        content: {
          'application/json': {
            schema: postInfoSchema(),
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Posts, {exclude: 'where', name: 'filterPost'})
    filter?: FilterExcludingWhere<Posts>,
  ): Promise<PostDataWithFlagInterface> {
    const userId = parseInt(userProfile[securityId]);
    const result = await this.postLogicController.findById({
      userId,
      id,
      filter,
    });
    if (!result) {
      throw new HttpErrors.NotFound(ErrorCode.POST_IS_NOT_AVAILABLE);
    }
    return result;
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/posts/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Posts PATCH success',
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
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdatePost',
            properties: {
              ...getModelSchemaRef(Posts, {
                title: 'newPost',
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
                  'medias',
                ],
              }).definitions.newPost.properties,
              locationId: {
                type: 'number',
              },
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents, {
                  title: 'mediaContentPostsUpdate',
                  exclude: ['postId', 'deletedAt'],
                }),
              },
            },
          },
        },
      },
    })
    posts: Posts,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.postLogicController.updateById({
      id,
      userId,
      posts,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/posts/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Posts DELETE success',
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
  ): Promise<{message: string}> {
    const userId = parseInt(userProfile[securityId]);
    return this.postLogicController.deleteById(id, {userId});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/posts/search', {
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
                  items: postInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async search(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'postSearch',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              mode: {
                type: 'string',
                enum: POST_SEARCH_MODES,
              },
              searchTypeCommunity: {
                type: 'string',
                enum: SEARCH_TYPE_COMMUNITY,
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
              where: getWhereSchemaFor(Posts),
            },
          },
        },
      },
    })
    postSearch: {
      q: string;
      mode: string;
      searchTypeCommunity?: string;
      offset: number;
      limit: number;
      skip: number;
      order: string[];
      where: Where<Posts>;
    },
  ): Promise<{count: number; data: PostDataWithFlagInterface[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.postLogicController.search({
      postSearch,
      userId,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/{id}/posts', {
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
                  items: postInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async findPostByUserId(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Posts, {name: 'filterPosts'}) filter?: Filter<Posts>,
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.postLogicController.findPostByUserId({
      userId,
      id,
      filter,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/posts/time', {
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
                      timeValue: {
                        type: 'string',
                      },
                      value: {
                        type: 'array',
                        items: postInfoSchema(),
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
  async findPostByUserIdGroupTime(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'FilterPostGroupByTime',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              timeType: {
                type: 'string',
                enum: ['MONTH', 'DAY'],
              },
              startTime: {
                type: 'string',
              },
              endTime: {
                type: 'string',
              },
              offset: {
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
            },
          },
        },
      },
    })
    filter: {
      timeType: string;
      offset: number;
      startTime?: string;
      endTime?: string;
      limit: number;
      order?: string[];
    },
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    const userFollow = await this.userLogicController.listUserFollowing(userId);
    const followIds = userFollow.map((item) => item.followingId);
    const defaultQuery = postInfoQueryWithBookmark(true, userId, followIds);
    const ctrFilter: Filter<Posts> = {
      ...defaultQuery,
      filter: {
        ...filter,
        offset: 0,
        limit: 0,
      },
      where: {
        creatorId: userId,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        //@ts-ignore
        deletedAt: null,
        showOnProfile: true,
      },
      order: ['createdAt DESC'],
    };
    if (filter?.order) {
      ctrFilter.order = [...filter.order];
    }
    if (filter?.startTime) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      ctrFilter.where.createdAt = {
        between: [
          moment(filter.startTime).utc().startOf('day').toISOString(),
          moment(filter.endTime || moment())
            .utc()
            .endOf('day')
            .toISOString(),
        ],
      };
    }
    const result = await this.postsRepository.find(ctrFilter);
    const posts: AnyObject[] = [];
    for (const postItem of result) {
      if (postItem.postType === POST_TYPE_SHARE_PLAN) {
        const mediaContents = postItem.medias ? (JSON.parse(postItem.medias) as MediaContents[]) : [];
        const metadata = postItem.plan
          ? {
              plan: {
                tasks: postItem.plan.tasks || [],
                planName: postItem.plan.planName,
                startDate: postItem.plan.startDate,
                endDate: postItem.plan.endDate,
              },
            }
          : {};
        posts.push({...postItem, mediaContents, metadata});
        continue;
      }
      if (postItem.sourcePost && !isEmpty(postItem.sourcePost)) {
        let sourcePost;
        let dataSharePostSharePlan;
        const blocked = await this.usersBlockHandler.checkBlockedByUserId(userId, postItem?.sourcePost?.creatorId);
        if (!blocked) {
          const mediaContents = postItem.sourcePost.medias
            ? (JSON.parse(postItem.sourcePost.medias) as MediaContents[])
            : [];
          sourcePost = {...postItem.sourcePost, mediaContents};
          if (
            postItem.postType === POST_TYPE_SHARED &&
            postItem.sourcePost?.postType === POST_TYPE_SHARE_PLAN &&
            postItem.sourcePost?.planId
          ) {
            dataSharePostSharePlan = await this.planLogicController.findById({
              userId,
              id: postItem.sourcePost?.planId,
            });
          }
        }
        posts.push({
          ...postItem,
          ...(sourcePost
            ? {
                sourcePost: {
                  ...sourcePost,
                  ...(dataSharePostSharePlan
                    ? {
                        metadata: {
                          plan: {
                            tasks: dataSharePostSharePlan.tasks || [],
                            planName: dataSharePostSharePlan.planName,
                            startDate: dataSharePostSharePlan.startDate,
                            endDate: dataSharePostSharePlan.endDate,
                          },
                        },
                      }
                    : {metadata: null}),
                },
              }
            : {sourcePost: null}),
        });
        continue;
      }
      posts.push(postItem);
    }
    const timeType = filter?.timeType === 'MONTH' ? 'month' : 'day';
    const objectData = groupBy(posts, (item) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return moment(item?.createdAt).utc().startOf(timeType).toISOString();
    });
    const limit = Number(filter?.limit || keys(objectData).length);
    const offset = Number(filter?.offset || 0);
    const start = Number(offset);
    const end = Number(limit);
    return {
      count: keys(objectData).length,
      data: keys(objectData)
        .map((name) => {
          return {
            timeValue: name,
            value: objectData[name],
          };
        })
        .slice(start, end),
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/user/posts/location', {
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
                      groupName: {
                        type: 'string',
                      },
                      length: {
                        type: 'string',
                      },
                      value: {
                        type: 'array',
                        items: postInfoSchema(),
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
  async findPostByUserIdGroupLocation(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param({
      name: 'FilterPostGroupByLocation',
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
              order: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    })
    filter: {
      q: string;
      offset: number;
      limit: number;
      order?: string[];
    },
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    let result: AnyObject[];
    const [userFollow, blockers] = await Promise.all([
      this.userLogicController.listUserFollowing(userId),
      this.usersBlockHandler.getListUserBlockIds(userId),
    ]);
    const followIds = userFollow.map((item) => item.followingId);
    const mustNot: AnyObject = [
      {
        match: {
          showOnProfile: false,
        },
      },
    ];
    if (blockers.length) {
      mustNot.push({
        terms: {
          creatorId: blockers,
        },
      });
    }
    if (filter?.q) {
      const body = {
        query: {
          bool: {
            must: [
              {
                match: {
                  creatorId: userId,
                },
              },
              {
                match: {
                  postType: POST_TYPE_CREATED,
                },
              },
            ],
            must_not: mustNot,
            minimum_should_match: 1,
          },
        },
      };
      if (filter.q) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        body.query.bool.should = [
          {
            multi_match: {
              query: changeAlias(filter?.q).trim(),
              operator: 'and',
              fields: ['location.country', 'location.areaLevel1'],
            },
          },
        ];
      }
      let listResultId: number[] = [];
      const searchResult = await this.postsRepository.elasticService.get(body);
      if (!isEmpty(searchResult)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        listResultId = Array.from(
          searchResult.body.hits.hits,
          (item: {
            _source: {
              locationId: number;
            };
          }) => {
            if (item) {
              return item._source.locationId;
            }
          },
        ).filter((item) => item);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete filter.q;
      const defaultQuery = postInfoQueryWithBookmark(true, userId, followIds);
      const ctrFilter: Filter<Posts> = {
        ...defaultQuery,
        where: {
          locationId: {
            inq: listResultId,
          },
          creatorId: userId,
          postType: POST_TYPE_CREATED,
          showOnProfile: true,
        },
        order: filter?.order,
      };
      // eslint-disable-next-line no-shadow
      const result = await this.postsRepository.find(ctrFilter);
      let objectData: AnyObject = {};
      objectData = groupBy(
        result.filter((item) => item.locationId),
        (item) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          return item.location?.areaLevel1;
        },
      );
      return {
        count: keys(objectData).length,
        data: keys(objectData)
          .map((name) => {
            const location = objectData[name][0].location;
            return {
              groupName: [location?.country, location?.areaLevel1].filter((item) => item).join(', '),
              areaLevel1: location?.areaLevel1 || '',
              length: objectData[name].length,
              value: objectData[name],
            };
          })
          .sort((a, b) => a.areaLevel1.localeCompare(b.areaLevel1)),
      };
    } else {
      const defaultQuery = postInfoQueryWithBookmark(true, userId, followIds);
      const ctrFilter = {
        ...defaultQuery,
        where: {
          creatorId: userId,
          postType: POST_TYPE_CREATED,
          showOnProfile: true,
        },
        order: ['createdAt DESC'],
      };
      if (filter?.order) {
        ctrFilter.order = [...filter.order];
      }
      result = await this.postsRepository.find(ctrFilter);
    }
    const objectData = groupBy(
      result.filter((item) => item.locationId),
      (item) => {
        if (item.location?.areaLevel1) {
          return item.location?.areaLevel1;
        }
        return item.location?.country;
      },
    );
    const limit = Number(filter?.limit || keys(objectData).length);
    const offset = Number(filter?.offset || 0);
    const start = Number(offset);
    const end = Number(limit);
    return {
      count: keys(objectData).length,
      data: keys(objectData)
        .map((name) => {
          const location = objectData[name][0].location;
          return {
            groupName: [location?.country, location?.areaLevel1].filter((item) => item).join(', '),
            areaLevel1: location?.areaLevel1 || '',
            length: objectData[name].length,
            value: objectData[name],
          };
        })
        .sort((a, b) => a.areaLevel1.localeCompare(b.areaLevel1))
        .slice(start, end),
    };
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/posts/plan', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Share Plan Instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Posts, {title: 'newPlanPostShared'}),
          },
        },
      },
    },
  })
  async sharePlan(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'newPlanPost',
            properties: {
              planId: {
                type: 'number',
              },
              content: {
                type: 'string',
              },
              accessType: {
                type: 'string',
                enum: POST_ACCESS_TYPES,
              },
              mediaContentIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
            },
            required: ['planId', 'content', 'accessType'],
          },
        },
      },
    })
    body: {
      planId: number;
      content: string;
      accessType: string;
      mediaContentIds: number[];
    },
  ): Promise<Posts> {
    return this.postsHandler.sharePlan(body, userProfile);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/posts/my-map', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Share Plan Instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Posts, {title: 'newMyMapPostShared'}),
          },
        },
      },
    },
  })
  async shareMyMap(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'newMyMapPost',
            properties: {
              mediaContentId: {
                type: 'number',
              },
              content: {
                type: 'string',
              },
              accessType: {
                type: 'string',
                enum: POST_ACCESS_TYPES,
              },
            },
            required: ['mediaContentId', 'content', 'accessType'],
          },
        },
      },
    })
    body: {mediaContentId: number; content: string; accessType: string},
  ): Promise<Posts> {
    return this.postsHandler.shareMyMap(body, userProfile);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @patch('/posts/plan/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Update Share Plan Instance',
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
  async updateSharePlan(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'updatePlanPost',
            properties: {
              planId: {
                type: 'number',
              },
              content: {
                type: 'string',
              },
              accessType: {
                type: 'string',
                enum: POST_ACCESS_TYPES,
              },
              mediaContentIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
            },
            required: ['content', 'accessType'],
          },
        },
      },
    })
    body: {
      planId?: number;
      content: string;
      accessType: string;
      mediaContentIds?: number[];
    },
  ): Promise<{success: boolean}> {
    return this.postsHandler.updateSharePlan(id, body, userProfile);
  }
}
