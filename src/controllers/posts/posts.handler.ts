import {Filter, repository} from '@loopback/repository';
import {Locations, Posts} from '../../models';
import {MediaContentsRepository, MyLocationsRepository, PostsRepository} from '../../repositories';
import {handleError} from '../../utils/handleError';
import {inject} from '@loopback/context';
import {PostLogicController} from '..';
import {securityId, UserProfile} from '@loopback/security';
import {POST_TYPE_MY_MAP, POST_TYPE_SHARE_PLAN} from '../../configs/post-constants';
import {MYMAP_ACCESS_TYPE_PUBLIC, MYMAP_TYPE_HAD_CAME} from '../../configs/mymap-constants';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '../../constants/error.constant';

export class PostsHandler {
  constructor(
    @repository(PostsRepository) public postsRepository: PostsRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(MyLocationsRepository)
    public myLocationsRepository: MyLocationsRepository,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
  ) {}

  async find(filter?: Filter<Posts>): Promise<{count: number; data: Posts[]}> {
    try {
      const [posts, count] = await Promise.all([
        this.postsRepository.find(filter),
        this.postsRepository.count(filter?.where),
      ]);
      return {count: count.count, data: posts};
    } catch (error) {
      return handleError(error);
    }
  }

  async getDetailPostServiceById(postId: number, userId: number, filter?: Filter<Posts>): Promise<Posts> {
    try {
      const newFilter: Filter<Posts> = {
        include: [
          {
            relation: 'mediaContents',
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
      const target = await this.postsRepository.findById(postId, newFilter);
      let isSavedLocation = false;
      if (target.locationId) {
        isSavedLocation = await this.postLogicController.checkLocationHadSaveToMyMap({
          userId,
          locationId: target.locationId,
        });
      }
      const result = {
        ...target,
        liked: Boolean(target.likes && target.likes.length),
        marked: Boolean(target.bookmarks && target.bookmarks.length),
        rated: Boolean(target.rankings && target.rankings.length),
        isSavedLocation,
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete result.likes;
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete result.bookmarks;
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete result.rankings;
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async sharePlan(
    data: {
      planId: number;
      content: string;
      accessType: string;
      mediaContentIds: number[];
    },
    user: UserProfile,
  ): Promise<Posts> {
    try {
      const {planId, content, accessType, mediaContentIds} = data;
      const mediaContents = await this.mediaContentsRepository.find({
        where: {
          id: {inq: mediaContentIds},
        },
      });
      return await this.postsRepository.create({
        planId,
        content,
        accessType,
        postType: POST_TYPE_SHARE_PLAN,
        creatorId: parseInt(user[securityId]),
        medias: JSON.stringify(mediaContents),
      });
    } catch (error) {
      return handleError(error);
    }
  }

  async shareMyMap(
    data: {mediaContentId: number; content: string; accessType: string},
    user: UserProfile,
  ): Promise<Posts> {
    try {
      const {mediaContentId, content, accessType} = data;
      const [media, myCompletedLocations] = await Promise.all([
        this.mediaContentsRepository.findById(mediaContentId),
        this.myLocationsRepository
          .find({
            where: {
              userId: parseInt(user[securityId]),
              myMapType: MYMAP_TYPE_HAD_CAME,
              accessType: MYMAP_ACCESS_TYPE_PUBLIC,
            },
            include: [
              {
                relation: 'location',
              },
            ],
          })
          .then((data) => data.map((item) => item.location)),
      ]);
      const post = await this.postsRepository.create({
        content,
        accessType,
        postType: POST_TYPE_MY_MAP,
        creatorId: parseInt(user[securityId]),
        metadata: {hadCameLocations: myCompletedLocations},
        medias: JSON.stringify([media]),
      });
      await this.mediaContentsRepository.updateById(mediaContentId, {
        postId: post.id,
      });
      return post;
    } catch (error) {
      return handleError(error);
    }
  }

  async updateSharePlan(
    id: number,
    data: {
      planId?: number;
      content: string;
      accessType: string;
      mediaContentIds?: number[];
    },
    user: UserProfile,
  ): Promise<{success: boolean}> {
    try {
      const {planId, content, accessType, mediaContentIds} = data;
      const post = await this.postsRepository.findById(id);
      if (!post || post.postType !== POST_TYPE_SHARE_PLAN) {
        throw new HttpErrors.NotFound(ErrorCode.OBJECT_NOT_FOUND);
      }
      const dataPost: Partial<Posts> = {};
      if (planId) {
        dataPost.planId = planId;
      }
      if (mediaContentIds?.length) {
        const mediaContents = await this.mediaContentsRepository.find({
          where: {
            id: {inq: mediaContentIds},
          },
        });
        dataPost.medias = JSON.stringify(mediaContents);
      }
      await this.postsRepository.updateById(id, {
        ...dataPost,
        content,
        accessType,
      });
      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }
}
