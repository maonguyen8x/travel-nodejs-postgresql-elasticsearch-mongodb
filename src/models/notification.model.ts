import {belongsTo, Entity, model, property} from '@loopback/repository';
import {NOTIFICATION_STATUS, notifyForEnum} from '../configs/notification-constants';
import {Users, UsersWithRelations} from './users.model';
import {Posts} from './posts.model';
import {Comments} from './comments.model';
import {ChildComment} from './child-comment.model';
import {Rankings} from './rankings.model';
import {ReplyRanking} from './reply-ranking.model';
import {Booking} from './booking.model';
import {Page} from './page.model';
import {Conversation} from './conversation.model';
import {LocationRequests} from './location-requests.model';
import {Report} from './report.model';
import {Feedback} from './feedback.model';
import {RoleTypeEnum} from '../controllers/booking/booking.constant';

@model()
export class NotificationMetadata {
  @property({
    type: 'string',
  })
  message?: string;

  @property({
    type: 'number',
    default: 0,
  })
  activityId?: number;
}

@model()
export class Notification extends Entity {
  @property({
    type: 'string',
  })
  notificationType?: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    jsonSchema: {
      enum: NOTIFICATION_STATUS(),
    },
  })
  status?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [notifyForEnum.user, notifyForEnum.page, notifyForEnum.owner],
    },
    default: notifyForEnum.user,
  })
  notificationFor?: string;

  @property({
    type: 'object',
  })
  metadata?: NotificationMetadata;

  @property({
    type: 'number',
    default: 0,
  })
  count?: number;

  @property({
    type: 'string',
  })
  participants: string;

  @property({
    type: 'boolean',
    default: false,
  })
  read?: boolean;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [RoleTypeEnum.system, RoleTypeEnum.page, RoleTypeEnum.user],
    },
  })
  cancelBy?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'number',
  })
  pageReviewId?: number;

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Posts)
  targetPostId: number;

  @belongsTo(() => Users)
  eventCreatorId: number;

  @belongsTo(() => Comments)
  commentId: number;

  @belongsTo(() => ChildComment)
  childCommentId: number;

  @belongsTo(() => Rankings)
  rankingId: number;

  @belongsTo(() => ReplyRanking)
  replyRankingId: number;

  @belongsTo(() => Booking)
  bookingId: number;

  @belongsTo(() => Page)
  pageId: number;

  @belongsTo(() => Conversation)
  conversationId: string;

  @belongsTo(() => LocationRequests)
  locationRequestId: number;

  @belongsTo(() => Report)
  reportId: number;

  @belongsTo(() => Feedback)
  feedbackId: string;

  constructor(data?: Partial<Notification>) {
    super(data);
  }
}

export interface NotificationRelations {
  // describe navigational properties here
  eventCreator: UsersWithRelations;
}

export type NotificationWithRelations = Notification & NotificationRelations;
