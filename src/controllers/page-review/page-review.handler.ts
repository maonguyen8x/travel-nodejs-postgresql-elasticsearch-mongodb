import {repository, Filter} from '@loopback/repository';
import {
  PageReviewRepository,
  PostsRepository,
  MediaContentsRepository,
  LikesRepository,
  PageRepository,
  LocationsRepository,
} from '../../repositories';
import {PageReview, Posts, PageReviewWithRelations} from '../../models';
import {handleError} from '../../utils/handleError';
import {POST_TYPE_PAGE_REVIEW, POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import {filterIncludePageReview} from './page-review.constant';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '@uto-tech/uto-types/dist/constants';
import {securityId, UserProfile} from '@loopback/security';
import {NotificationLogicController} from '../notification/notification-logic.controller';
import {inject} from '@loopback/context';
import {NOTIFICATION_TYPE_USER_RANKING_PAGE} from '../../configs/notification-constants';
import {convertPointRankingToPointScore} from '../../utils/common';

export class PageReviewHandler {
  constructor(
    @repository(PageReviewRepository)
    public pageReviewRepository: PageReviewRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(PostsRepository) public postsRepository: PostsRepository,
    @repository(LikesRepository) public likesRepository: LikesRepository,
    @repository(PageRepository) public pageRepository: PageRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
  ) {}

  async create(
    post: Pick<Posts, 'content'>,
    pageReview: Pick<PageReview, 'point' | 'pageId' | 'createdById'>,
    mediaContentIds: number[],
  ): Promise<Partial<PageReviewWithRelations>> {
    try {
      const mediaContents = mediaContentIds.length
        ? await this.mediaContentsRepository.find({
            where: {
              id: {inq: mediaContentIds},
            },
          })
        : [];
      const postPageReview = await this.postsRepository.create({
        mediaContents: mediaContents,
        content: post.content,
        postType: POST_TYPE_PAGE_REVIEW,
        accessType: POST_ACCESS_TYPE_PUBLIC,
        creatorId: pageReview.createdById,
        showOnProfile: false,
      });
      const ranking = await this.pageReviewRepository.create({
        ...pageReview,
        postId: postPageReview.id,
      });
      await Promise.all([this.updateRankingPoint(ranking.pageId), this.handleCreateNotification(ranking)]);
      return ranking;
    } catch (error) {
      return handleError(error);
    }
  }

  async handleCreateNotification(pageReview: PageReview): Promise<void> {
    const targetPage = await this.pageRepository.findById(pageReview.pageId);
    const targetPost = await this.postsRepository.findById(pageReview.postId);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.createNotification({
      listUserReceive: [targetPage.relatedUserId],
      notificationType: NOTIFICATION_TYPE_USER_RANKING_PAGE,
      eventCreatorId: pageReview.createdById,
      targetPost: targetPost.id,
      pageReviewId: pageReview.id,
    });
  }

  async find(
    filter: Filter<PageReview>,
    user: UserProfile,
  ): Promise<{
    count: number;
    data: Partial<PageReviewWithRelations>[];
  }> {
    try {
      const [{count}, data] = await Promise.all([
        this.pageReviewRepository.count(filter?.where),
        this.pageReviewRepository.find({
          ...filter,
          fields: {id: true},
        }),
      ]);
      return {
        count,
        data: await Promise.all(data.map((item) => this.findById(item.id || 0, user))),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findOne(filter: Filter<PageReview>, user: UserProfile): Promise<Partial<PageReviewWithRelations> | null> {
    try {
      const record = await this.pageReviewRepository.findOne({
        where: filter.where,
        fields: {id: true},
      });
      if (!record) return record;
      return await this.findById(record.id || 0, user);
    } catch (error) {
      return handleError(error);
    }
  }

  async findById(id: number, user: UserProfile): Promise<Partial<PageReviewWithRelations>> {
    try {
      const data = await this.pageReviewRepository.findById(id, {
        include: filterIncludePageReview(),
      });
      const post = data.post;
      const userId = parseInt(user[securityId]);

      return {
        ...data,
        post: {
          ...post,
          liked: await this.likesRepository.liked(post.id || 0, userId),
        },
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async updateById(
    id: number,
    post: Pick<Posts, 'content'>,
    pageReview: Pick<PageReview, 'point' | 'createdById'>,
    mediaContentIds: number[],
  ): Promise<void> {
    try {
      const mediaContents = mediaContentIds.length
        ? await this.mediaContentsRepository.find({
            where: {
              id: {inq: mediaContentIds},
            },
          })
        : [];
      const record = await this.pageReviewRepository.findById(id);
      const hasPermission = record.createdById === pageReview.createdById;
      if (!hasPermission) throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      await Promise.all([
        this.postsRepository.updateById(record.postId, {
          mediaContents,
          content: post.content,
        }),
        this.pageReviewRepository.updateById(id, {
          point: pageReview.point,
          pageId: record.pageId,
        }),
      ]);
      await this.updateRankingPoint(record.pageId);
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteById(id: number, user: UserProfile): Promise<void> {
    try {
      const record = await this.pageReviewRepository.findOne({
        where: {id, createdById: parseInt(user[securityId])},
      });
      if (record) {
        await this.pageReviewRepository.deleteById(id);
        await this.updateRankingPoint(record.pageId);
      }
    } catch (error) {
      return handleError(error);
    }
  }

  // update ranking point for location with page
  async updateRankingPoint(pageId: number): Promise<void> {
    const [targetPage, listPageReview] = await Promise.all([
      this.pageRepository.findById(pageId),
      this.pageReviewRepository.find({
        where: {
          pageId: pageId,
        },
      }),
    ]);
    if (targetPage?.locationId) {
      let _score = 0;
      let _averagePoint = 0;
      if (listPageReview.length) {
        listPageReview.map((item) => {
          _score += convertPointRankingToPointScore(item.point || 0);
          _averagePoint += item.point || 0;
        });
        _averagePoint = Math.round(_averagePoint / listPageReview.length);
      }
      await this.locationsRepository.updateById(targetPage?.locationId, {
        score: _score,
        averagePoint: _averagePoint,
        totalReview: listPageReview.length,
      });
    }
  }
}
