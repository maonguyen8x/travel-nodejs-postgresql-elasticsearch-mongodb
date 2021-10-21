import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {Filter} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, del, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {AUTHORIZE_CUSTOMER} from '../../constants/authorize.constant';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {Avatars, MediaContents, Posts, Profiles, ServiceReview, ServiceReviewWithRelations, Users} from '../../models';
import {filters} from '../../utils/Filter';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {ServiceReviewHandler} from './service-review.handler';
import {ServiceReviewPost, ServiceReviewPatch} from './service-review.interface';

export class ServiceReviewController {
  constructor(
    // @repository(ServiceReviewRepository) public serviceReviewRepository : ServiceReviewRepository,
    @inject(HandlerBindingKeys.SERVICE_REVIEW_HANDLER)
    public serviceReviewHandler: ServiceReviewHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/service-reviews', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'ServiceReview model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(ServiceReview)},
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(ServiceReview, {
                title: 'NewServiceReview',
                exclude: ['id', 'createdAt', 'deletedAt', 'updatedAt', 'postId', 'createdById', 'isActive'],
              }).definitions['NewServiceReview'].properties,
              content: {
                type: 'string',
              },
              mediaContentIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
            },
            required: ['content', 'point', 'serviceId', 'bookingId'],
          },
        },
      },
    })
    serviceReviewPost: ServiceReviewPost,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<ServiceReview> {
    const post = {
      content: serviceReviewPost.content,
    };
    const serviceReview = {
      point: serviceReviewPost.point,
      serviceId: serviceReviewPost.serviceId,
      bookingId: serviceReviewPost.bookingId,
      createdById: parseInt(userProfile[securityId]),
    };
    const mediaContentIds = serviceReviewPost.mediaContentIds || [];
    return this.serviceReviewHandler.create(post, serviceReview, mediaContentIds);
  }

  // @get('/service-reviews/count', {
  //   responses: {
  //     '200': {
  //       description: 'ServiceReview model count',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async count(
  //   @param.where(ServiceReview) where?: Where<ServiceReview>,
  // ): Promise<Count> {
  //   return this.serviceReviewRepository.count(where);
  // }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/service-reviews', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of ServiceReview model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {type: 'number'},
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(ServiceReview).definitions['ServiceReview'].properties,
                      createdBy: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Users).definitions['Users'].properties,
                          profiles: {
                            type: 'object',
                            properties: {
                              ...getModelSchemaRef(Profiles).definitions['Profiles'].properties,
                              avatars: {
                                type: 'object',
                                properties: {
                                  ...getModelSchemaRef(Avatars).definitions['Avatars'].properties,
                                  mediaContent: {
                                    type: 'object',
                                    properties: {
                                      ...getModelSchemaRef(MediaContents).definitions['MediaContents'].properties,
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      post: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Posts).definitions['Posts'].properties,
                          mediaContents: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                ...getModelSchemaRef(MediaContents).definitions['MediaContents'].properties,
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
  async find(
    @param.filter(ServiceReview, {name: 'filterServiceReviews'})
    filter?: Filter<ServiceReview>,
  ): Promise<{
    count: number;
    data: ServiceReviewWithRelations[];
  }> {
    return this.serviceReviewHandler.find(filters(filter));
  }

  // @get('/service-reviews/{id}', {
  //   responses: {
  //     '200': {
  //       description: 'ServiceReview model instance',
  //       content: {
  //         'application/json': {
  //           schema: getModelSchemaRef(ServiceReview, {includeRelations: true}),
  //         },
  //       },
  //     },
  //   },
  // })
  // async findById(
  //   @param.path.number('id') id: number,
  //   @param.filter(ServiceReview, {exclude: 'where'}) filter?: FilterExcludingWhere<ServiceReview>
  // ): Promise<ServiceReview> {
  //   return this.serviceReviewRepository.findById(id, filter);
  // }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/service-reviews/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'ServiceReview PATCH success',
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
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(ServiceReview, {
                title: 'NewServiceReview',
                exclude: ['id', 'createdAt', 'deletedAt', 'updatedAt', 'postId', 'createdById', 'isActive'],
              }).definitions['NewServiceReview'].properties,
              content: {
                type: 'string',
              },
              mediaContentIds: {
                type: 'array',
                items: {
                  type: 'number',
                },
              },
            },
            required: ['content', 'point', 'serviceId', 'bookingId'],
          },
        },
      },
    })
    serviceReviewPost: ServiceReviewPatch,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<void> {
    const post = {
      content: serviceReviewPost.content,
    };
    const serviceReview = {
      point: serviceReviewPost.point,
      createdById: parseInt(userProfile[securityId]),
    };
    const mediaContentIds = serviceReviewPost.mediaContentIds || [];

    await this.serviceReviewHandler.updateById(id, post, serviceReview, mediaContentIds);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @del('/service-reviews/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'ServiceReview DELETE success',
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
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<void> {
    await this.serviceReviewHandler.deleteById(id, userProfile);
  }
}
