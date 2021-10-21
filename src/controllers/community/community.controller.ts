import {Filter} from '@loopback/repository';
import {authenticate} from '@loopback/authentication';
import {MediaContents, Posts} from '../../models';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_CUSTOMER} from '../../constants/authorize.constant';
import {inject} from '@loopback/context';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PostDataWithFlagInterface} from '../posts/post.contant';
import {POST_ACCESS_TYPES, POST_TYPES} from '../../configs/post-constants';
import {CommunityLogicController} from './community-logic.controller';
import {postInfoSchema} from '../posts/post.schema';
export class CommunityController {
  constructor(
    @inject('controllers.CommunityLogicController')
    public communityLogicController: CommunityLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/community', {
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
                  items: communityInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async communities(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(Posts, {name: 'filterPosts'}) filter?: Filter<Posts>,
  ): Promise<{
    count: number;
    data: PostDataWithFlagInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.communityLogicController.find({
      userId,
      filter,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/community/similar', {
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
  async similar(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(Posts, {name: 'filterPosts'}) filter?: Filter<Posts>,
  ): Promise<{
    count: number;
    data: PostDataWithFlagInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.communityLogicController.similar({
      userId,
      filter,
    });
  }
}

export function communityInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Posts, {
        exclude: [
          'listUsersReceiveNotifications',
          'activity',
          'totalComment',
          'accessType',
          'status',
          'totalLike',
          'totalShare',
          'updatedAt',
          'deletedAt',
          'isPublicPlan',
          'medias',
          'showOnProfile',
          'totalRanking',
        ],
        title: 'contentPost',
      }).definitions.contentPost.properties,
      accessType: {
        type: 'string',
        enum: POST_ACCESS_TYPES,
      },
      postType: {
        type: 'string',
        enum: POST_TYPES,
      },
      mediaContents: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
          },
        },
      },
    },
  };
}
