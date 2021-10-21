import {AnyObject, DeepPartial, DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {
  Notification,
  NotificationRelations,
  Users,
  Posts,
  Comments,
  ChildComment,
  Rankings,
  ReplyRanking,
  Booking,
  Page,
  Conversation,
  LocationRequests,
  Report,
  Feedback,
} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import moment from 'moment';
import {UsersRepository} from './users.repository';
import {PostsRepository} from './posts.repository';
import {CommentsRepository} from './comments.repository';
import {ChildCommentRepository} from './child-comment.repository';
import {RankingsRepository} from './rankings.repository';
import {ReplyRankingRepository} from './reply-ranking.repository';
import {BookingRepository} from './booking.repository';
import {PageRepository} from './page.repository';
import {ConversationRepository} from './conversation.repository';
import {LocationRequestsRepository} from './location-requests.repository';
import {ReportRepository} from './report.repository';
import {FeedbackRepository} from './feedback.repository';
import {
  ActivityNotifyTypeEnum,
  NOTIFICATION_STATUS_NEW,
  NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE,
  NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER,
  NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER,
  NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW,
  NOTIFICATION_TYPE_USER_RANKING_PAGE,
  notifyForEnum,
} from '../configs/notification-constants';
import {omit} from 'lodash';

export class NotificationRepository extends DefaultCrudRepository<
  Notification,
  typeof Notification.prototype.id,
  NotificationRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Notification.prototype.id>;

  public readonly targetPost: BelongsToAccessor<Posts, typeof Notification.prototype.id>;

  public readonly eventCreator: BelongsToAccessor<Users, typeof Notification.prototype.id>;

  public readonly comment: BelongsToAccessor<Comments, typeof Notification.prototype.id>;

  public readonly childComment: BelongsToAccessor<ChildComment, typeof Notification.prototype.id>;

  public readonly ranking: BelongsToAccessor<Rankings, typeof Notification.prototype.id>;

  public readonly replyRanking: BelongsToAccessor<ReplyRanking, typeof Notification.prototype.id>;

  public readonly booking: BelongsToAccessor<Booking, typeof Notification.prototype.id>;

  public readonly page: BelongsToAccessor<Page, typeof Notification.prototype.id>;

  public readonly conversation: BelongsToAccessor<Conversation, typeof Notification.prototype.id>;

  public readonly locationRequest: BelongsToAccessor<LocationRequests, typeof Notification.prototype.id>;

  public readonly report: BelongsToAccessor<Report, typeof Notification.prototype.id>;

  public readonly feedback: BelongsToAccessor<Feedback, typeof Notification.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('CommentsRepository')
    protected commentsRepositoryGetter: Getter<CommentsRepository>,
    @repository.getter('ChildCommentRepository')
    protected childCommentRepositoryGetter: Getter<ChildCommentRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @repository.getter('ReplyRankingRepository')
    protected replyRankingRepositoryGetter: Getter<ReplyRankingRepository>,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,
    @repository.getter('ConversationRepository')
    protected conversationRepositoryGetter: Getter<ConversationRepository>,
    @repository.getter('LocationRequestsRepository')
    protected locationRequestsRepositoryGetter: Getter<LocationRequestsRepository>,
    @repository.getter('ReportRepository')
    protected reportRepositoryGetter: Getter<ReportRepository>,
    @repository.getter('FeedbackRepository')
    protected feedbackRepositoryGetter: Getter<FeedbackRepository>,
  ) {
    super(Notification, dataSource);
    this.feedback = this.createBelongsToAccessorFor('feedback', feedbackRepositoryGetter);
    this.registerInclusionResolver('feedback', this.feedback.inclusionResolver);
    this.report = this.createBelongsToAccessorFor('report', reportRepositoryGetter);
    this.registerInclusionResolver('report', this.report.inclusionResolver);
    this.locationRequest = this.createBelongsToAccessorFor('locationRequest', locationRequestsRepositoryGetter);
    this.registerInclusionResolver('locationRequest', this.locationRequest.inclusionResolver);
    this.conversation = this.createBelongsToAccessorFor('conversation', conversationRepositoryGetter);
    this.registerInclusionResolver('conversation', this.conversation.inclusionResolver);
    this.page = this.createBelongsToAccessorFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);
    this.booking = this.createBelongsToAccessorFor('booking', bookingRepositoryGetter);
    this.registerInclusionResolver('booking', this.booking.inclusionResolver);
    this.replyRanking = this.createBelongsToAccessorFor('replyRanking', replyRankingRepositoryGetter);
    this.registerInclusionResolver('replyRanking', this.replyRanking.inclusionResolver);
    this.ranking = this.createBelongsToAccessorFor('ranking', rankingsRepositoryGetter);
    this.registerInclusionResolver('ranking', this.ranking.inclusionResolver);
    this.childComment = this.createBelongsToAccessorFor('childComment', childCommentRepositoryGetter);
    this.registerInclusionResolver('childComment', this.childComment.inclusionResolver);
    this.comment = this.createBelongsToAccessorFor('comment', commentsRepositoryGetter);
    this.registerInclusionResolver('comment', this.comment.inclusionResolver);
    this.eventCreator = this.createBelongsToAccessorFor('eventCreator', usersRepositoryGetter);
    this.registerInclusionResolver('eventCreator', this.eventCreator.inclusionResolver);
    this.targetPost = this.createBelongsToAccessorFor('targetPost', postsRepositoryGetter);
    this.registerInclusionResolver('targetPost', this.targetPost.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  async create(
    entity: Partial<Notification> | {[P in keyof Notification]?: DeepPartial<Notification[P]>} | Notification,
    options?: AnyObject,
  ): Promise<Notification> {
    let whereCheckExist = {};
    const listUnGroupNotification = [
      NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW,
      NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER,
      NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER,
      String(ActivityNotifyTypeEnum.remove),
      String(ActivityNotifyTypeEnum.invite),
      String(ActivityNotifyTypeEnum.join),
      String(ActivityNotifyTypeEnum.comingSoon),
    ];
    if (entity.notificationFor === notifyForEnum.page || entity.notificationFor === notifyForEnum.user) {
      if (listUnGroupNotification.includes(entity?.notificationType || '')) {
        return super.create(
          {
            ...entity,
            participants: `${entity.eventCreatorId}`,
            createdAt: moment().utc().toISOString(),
            updatedAt: moment().utc().toISOString(),
          },
          options,
        );
      }
    }
    if (
      entity.notificationType === NOTIFICATION_TYPE_USER_RANKING_PAGE ||
      entity.notificationType === NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE
    ) {
      whereCheckExist = {
        ...(entity.pageId && {
          pageId: entity.pageId,
          status: NOTIFICATION_STATUS_NEW,
        }),
      };
    } else {
      whereCheckExist = {
        ...(entity.targetPostId && {
          targetPostId: entity.targetPostId,
        }),
      };
    }
    const checkExistNotification = await super.findOne({
      where: {
        ...whereCheckExist,
        notificationFor: entity.notificationFor,
        notificationType: entity.notificationType,
        userId: entity.userId,
      },
    });
    if (checkExistNotification) {
      await super.updateById(checkExistNotification.id, {
        ...omit(checkExistNotification, ['id']),
        eventCreatorId: entity.eventCreatorId,
        commentId: entity.commentId,
        childCommentId: entity.childCommentId,
        ...(entity.rankingId && {
          rankingId: entity.rankingId,
        }),
        ...(entity.replyRankingId && {
          replyRankingId: entity.replyRankingId,
        }),
        ...(entity.pageReviewId && {
          pageReviewId: entity.pageReviewId,
        }),
        ...(entity.conversationId && {
          conversationId: entity.conversationId,
        }),
        participants: checkExistNotification?.participants
          ? Array.from(
              new Set(checkExistNotification.participants.split(',')).add(`${entity.eventCreatorId}`),
            ).toString()
          : `${entity.eventCreatorId}`,
        status: NOTIFICATION_STATUS_NEW,
        read: false,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      });
      return super.findById(checkExistNotification.id);
    } else {
      return super.create(
        {
          ...entity,
          participants: `${entity.eventCreatorId}`,
          createdAt: moment().utc().toISOString(),
          updatedAt: moment().utc().toISOString(),
        },
        options,
      );
    }
  }

  update(entity: Notification, options?: AnyObject): Promise<void> {
    return super.update(entity, options);
  }

  updateById(
    id: typeof Notification.prototype.id,
    data: Partial<Notification> | {[P in keyof Notification]?: DeepPartial<Notification[P]>} | Notification,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
