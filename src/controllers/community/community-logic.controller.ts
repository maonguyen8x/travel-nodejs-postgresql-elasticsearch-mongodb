import {AnyObject, Filter, repository} from '@loopback/repository';
import {PostsRepository} from '../../repositories';
import {
  POST_ACCESS_TYPE_PUBLIC,
  POST_TYPE_CREATED,
  POST_TYPE_MY_MAP,
  POST_TYPE_PAGE,
  POST_TYPE_SHARE_PLAN,
  POST_TYPE_ACTIVITY,
} from '../../configs/post-constants';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {UsersBlockHandler} from '../user-block/users-block.handler';
import {MediaContents, Posts} from '../../models';
import {PostDataWithFlagInterface} from '../posts/post.contant';
import {PostStatusEnum} from '../../configs/post-constants';
import {handleError} from '../../utils/handleError';
import {PostLogicController} from '../posts/post-logic.controller';

export class CommunityLogicController {
  constructor(
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @inject(HandlerBindingKeys.USERS_BLOCK_HANDLER)
    public usersBlockHandler: UsersBlockHandler,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
  ) {}

  async find({
    userId,
    filter,
  }: {
    userId: number;
    filter?: Filter<Posts>;
  }): Promise<{
    count: number;
    data: PostDataWithFlagInterface[];
  }> {
    try {
      const newFilter: Filter<Posts> = getListPostQuery({
        filter,
      });

      const blockers = await this.usersBlockHandler.getListUserBlockIds(userId);

      const [result, count] = await Promise.all([
        this.postsRepository.find({
          limit: filter?.limit || 20,
          offset: filter?.offset,
          include: newFilter.include,
          fields: newFilter.fields,
          where: {
            status: PostStatusEnum.public,
            postType: {
              inq: [POST_TYPE_CREATED, POST_TYPE_PAGE, POST_TYPE_MY_MAP, POST_TYPE_SHARE_PLAN, POST_TYPE_ACTIVITY],
            },
            creatorId: {
              nin: blockers,
            },
            accessType: POST_ACCESS_TYPE_PUBLIC,
            isPublicPlan: true,
          },
          order: ['createdAt DESC'],
        }),
        this.postsRepository.count({
          status: PostStatusEnum.public,
          postType: {
            inq: [POST_TYPE_CREATED, POST_TYPE_PAGE, POST_TYPE_MY_MAP, POST_TYPE_SHARE_PLAN, POST_TYPE_ACTIVITY],
          },
          creatorId: {
            nin: blockers,
          },
          accessType: POST_ACCESS_TYPE_PUBLIC,
          isPublicPlan: true,
        }),
      ]);

      const data: AnyObject[] = result.map((post) => {
        const mediaContents: MediaContents[] =
          post.postType === POST_TYPE_SHARE_PLAN ? (post.medias ? JSON.parse(post.medias) : []) : post.mediaContents;

        return {
          ...post,
          mediaContents,
        };
      });

      return {
        data,
        count: count?.count || 0,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async similar({
    userId,
    filter,
  }: {
    userId: number;
    filter?: Filter<Posts>;
  }): Promise<{
    count: number;
    data: PostDataWithFlagInterface[];
  }> {
    try {
      const blockers = await this.usersBlockHandler.getListUserBlockIds(userId);
      const [result, count] = await Promise.all([
        this.postsRepository.find({
          limit: filter?.limit || 10,
          offset: filter?.offset || 0,
          include: [
            {
              relation: 'mediaContents',
            },
            {
              relation: 'plan',
              scope: {
                include: [
                  {
                    relation: 'tasks',
                    scope: {
                      order: ['taskDate ASC', 'index ASC'],
                      include: [
                        {
                          relation: 'location',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              relation: 'location',
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
                      ],
                    },
                  },
                  {
                    relation: 'page',
                  },
                ],
              },
            },
            {
              relation: 'activity',
              scope: {
                include: [
                  {
                    relation: 'location',
                  },
                ],
              },
            },
          ],
          where: {
            ...filter?.where,
            status: PostStatusEnum.public,
            postType: {
              inq: [POST_TYPE_CREATED, POST_TYPE_PAGE, POST_TYPE_MY_MAP, POST_TYPE_SHARE_PLAN, POST_TYPE_ACTIVITY],
            },
            creatorId: {
              nin: blockers,
            },
            accessType: POST_ACCESS_TYPE_PUBLIC,
            isPublicPlan: true,
          },
          order: ['createdAt DESC'],
        }),
        this.postsRepository.count({
          ...filter?.where,
          status: PostStatusEnum.public,
          postType: {
            inq: [POST_TYPE_CREATED, POST_TYPE_PAGE, POST_TYPE_MY_MAP, POST_TYPE_SHARE_PLAN, POST_TYPE_ACTIVITY],
          },
          creatorId: {
            nin: blockers,
          },
          accessType: POST_ACCESS_TYPE_PUBLIC,
          isPublicPlan: true,
        }),
      ]);

      const resultWithFlagIsSavedLocation = await Promise.all(
        result.map((item) => this.postLogicController.generateFlagPost(item, userId)),
      );
      return {
        count: count?.count || 0,
        data: resultWithFlagIsSavedLocation,
      };
    } catch (e) {
      return handleError(e);
    }
  }
}

const getListPostQuery = ({filter}: {filter?: Filter<Posts>}) => {
  return {
    order: ['createdAt DESC'],
    ...filter,
    fields: {
      averagePoint: true,
      backgroundPost: true,
      content: true,
      creatorId: true,
      id: true,
      locationId: true,
      mediaContents: true,
      pageId: true,
      planId: true,
      postType: true,
      sourcePostId: true,
      isPublicLocation: true,
      medias: true,
      createdAt: true,
      firstMediaType: true,
      metadata: true,
    },
    include: [
      {
        relation: 'mediaContents',
        scope: {
          fields: {
            id: true,
            url: true,
            urlBlur: true,
            urlTiny: true,
            urlOptimize: true,
            urlBackground: true,
            resourceType: true,
            postId: true,
            metadata: true,
          },
        },
      },
    ],
  };
};
