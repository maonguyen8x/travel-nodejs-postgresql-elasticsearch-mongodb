import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {Filter} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, del, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {AUTHORIZE_CUSTOMER} from '../../constants/authorize.constant';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {PageReview, PageReviewWithRelations} from '../../models';
import {filters} from '../../utils/Filter';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {PageReviewHandler} from './page-review.handler';
import {PageReviewPost, PageReviewPatch} from './page-review.interface';
import {pageReviewSchema} from './page-review.constant';

export class PageReviewController {
  constructor(
    @inject(HandlerBindingKeys.PAGE_REVIEW_HANDLER)
    public pageReviewHandler: PageReviewHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/page-reviews', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'PageReview model instance',
        content: {'application/json': {schema: getModelSchemaRef(PageReview)}},
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
              ...getModelSchemaRef(PageReview, {
                title: 'NewPageReview',
                exclude: ['id', 'createdAt', 'deletedAt', 'updatedAt', 'isActive', 'createdById', 'postId'],
              }).definitions['NewPageReview'].properties,
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
            required: ['content', 'point', 'pageId'],
          },
        },
      },
    })
    pageReview: PageReviewPost,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Partial<PageReviewWithRelations>> {
    // eslint-disable-next-line no-shadow
    const post = {
      content: pageReview.content,
    };
    const pageReviewData = {
      pageId: pageReview.pageId,
      point: pageReview.point,
      createdById: parseInt(userProfile[securityId]),
    };
    const mediaContentIds = pageReview.mediaContentIds || [];
    return this.pageReviewHandler.create(post, pageReviewData, mediaContentIds);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page-reviews', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of PageReview model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {type: 'number'},
                data: {
                  type: 'array',
                  items: pageReviewSchema(),
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
    @param.filter(PageReview, {name: 'filterPageReviews'})
    filter?: Filter<PageReview>,
  ): Promise<{
    count: number;
    data: Partial<PageReviewWithRelations>[];
  }> {
    return this.pageReviewHandler.find(filters(filter), userProfile);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/page-reviews/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'PageReview model instance',
        content: {
          'application/json': {
            schema: pageReviewSchema(),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Partial<PageReviewWithRelations>> {
    return this.pageReviewHandler.findById(id, userProfile);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/page-reviews/{id}', {
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
              ...getModelSchemaRef(PageReview, {
                title: 'NewPageReview',
                exclude: ['id', 'createdAt', 'deletedAt', 'updatedAt', 'isActive', 'createdById', 'postId'],
              }).definitions['NewPageReview'].properties,
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
            required: ['content', 'point'],
          },
        },
      },
    })
    pageReview: PageReviewPatch,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<void> {
    // eslint-disable-next-line no-shadow
    const post = {
      content: pageReview.content,
    };
    const pageReviewData = {
      point: pageReview.point,
      createdById: parseInt(userProfile[securityId]),
    };
    const mediaContentIds = pageReview.mediaContentIds || [];
    await this.pageReviewHandler.updateById(id, post, pageReviewData, mediaContentIds);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @del('/page-reviews/{id}', {
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
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<void> {
    await this.pageReviewHandler.deleteById(id, userProfile);
  }
}
