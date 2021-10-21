import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Users} from './users.model';
import {MediaContents} from './media-contents.model';
import {feedbackStatusEnum} from '../controllers/feedback/feedback.constant';

@model()
export class Feedback extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [
        feedbackStatusEnum.CLOSED,
        feedbackStatusEnum.COMPLETED,
        feedbackStatusEnum.PENDING,
        feedbackStatusEnum.PROCESSING,
        feedbackStatusEnum.WAITING_FOR_PROCESSING,
      ],
    },
    default: feedbackStatusEnum.WAITING_FOR_PROCESSING,
  })
  status?: string;

  @property({
    type: 'string',
    required: true,
  })
  content?: string;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  attachments?: MediaContents[];

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<Feedback>) {
    super(data);
  }
}

export interface FeedbackRelations {
  // describe navigational properties here
}

export type FeedbackWithRelations = Feedback & FeedbackRelations;
