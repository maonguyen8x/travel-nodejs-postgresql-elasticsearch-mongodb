import {repository, Filter} from '@loopback/repository';
import {
  BookingRepository,
  LocationsRepository,
  MediaContentsRepository,
  PostsRepository,
  ServiceRepository,
  ServiceReviewRepository,
} from '../../repositories';
import {Posts, ServiceReview, ServiceReviewWithRelations} from '../../models';
import {handleError} from '../../utils/handleError';
import {POST_TYPE_SERVICE_REVIEW, POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import {filterInclude} from './service-review.constant';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '@uto-tech/uto-types/dist/constants';
import {securityId, UserProfile} from '@loopback/security';
import {convertPointRankingToPointScore} from '../../utils/common';

export class ServiceReviewHandler {
  constructor(
    @repository(ServiceReviewRepository)
    public serviceReviewRepository: ServiceReviewRepository,
    @repository(PostsRepository) public postsRepository: PostsRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(BookingRepository) public bookingRepository: BookingRepository,
    @repository(ServiceRepository)
    public serviceRepository: ServiceRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
  ) {}

  async create(
    post: Pick<Posts, 'content'>,
    serviceReview: Pick<ServiceReview, 'point' | 'serviceId' | 'bookingId' | 'createdById'>,
    mediaContentIds: number[],
  ): Promise<ServiceReviewWithRelations> {
    try {
      const mediaContents = mediaContentIds.length
        ? await this.mediaContentsRepository.find({
            where: {
              id: {inq: mediaContentIds},
            },
          })
        : [];
      const postServiceReview = await this.postsRepository.create({
        mediaContents: mediaContents,
        content: post.content,
        postType: POST_TYPE_SERVICE_REVIEW,
        accessType: POST_ACCESS_TYPE_PUBLIC,
        creatorId: serviceReview.createdById,
        showOnProfile: false,
      });
      const result = await this.serviceReviewRepository.create({
        ...serviceReview,
        postId: postServiceReview.id,
      });
      await Promise.all([
        this.updateRankingPoint(result.serviceId),
        this.bookingRepository.updateById(serviceReview.bookingId, {
          hasReviewed: true,
        }),
      ]);
      return result;
    } catch (error) {
      return handleError(error);
    }
  }

  async find(
    filter?: Filter<ServiceReview>,
  ): Promise<{
    count: number;
    data: ServiceReviewWithRelations[];
  }> {
    try {
      const [{count}, data] = await Promise.all([
        this.serviceReviewRepository.count(filter?.where),
        this.serviceReviewRepository.find({
          ...filter,
          include: filterInclude(),
        }),
      ]);
      return {count, data};
    } catch (error) {
      return handleError(error);
    }
  }

  async updateById(
    id: number,
    post: Pick<Posts, 'content'>,
    serviceReview: Pick<ServiceReview, 'point' | 'createdById'>,
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
      const record = await this.serviceReviewRepository.findById(id);
      const hasPermission = record.createdById === serviceReview.createdById;
      if (!hasPermission) throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      await Promise.all([
        this.postsRepository.updateById(record.postId, {
          mediaContents,
          content: post.content,
          showOnProfile: false,
        }),
        this.serviceReviewRepository.updateById(id, {
          point: serviceReview.point,
        }),
      ]);
      await this.updateRankingPoint(record.serviceId);
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteById(id: number, user: UserProfile): Promise<void> {
    try {
      const record = await this.serviceReviewRepository.findOne({
        where: {id, createdById: parseInt(user[securityId])},
      });

      if (record) {
        await Promise.all([
          this.serviceReviewRepository.deleteById(id),
          this.postsRepository.deleteById(record.postId),
        ]);
        await this.updateRankingPoint(record.serviceId);
      }
    } catch (error) {
      return handleError(error);
    }
  }

  // update ranking point for location with service
  async updateRankingPoint(serviceId: number): Promise<void> {
    const [targetService, listServiceReview] = await Promise.all([
      this.serviceRepository.findById(serviceId, {
        include: [{relation: 'post'}],
      }),
      this.serviceReviewRepository.find({
        where: {
          serviceId: serviceId,
        },
      }),
    ]);
    if (targetService?.post?.locationId) {
      let _score = 0;
      let _averagePoint = 0;
      if (listServiceReview.length) {
        listServiceReview.map((item) => {
          _score += convertPointRankingToPointScore(item.point || 0);
          _averagePoint += item.point || 0;
        });
        _averagePoint = Math.round(_averagePoint / listServiceReview.length);
      }
      await this.locationsRepository.updateById(targetService?.post?.locationId, {
        score: _score,
        averagePoint: _averagePoint,
        totalReview: listServiceReview.length,
      });
    }
  }
}
