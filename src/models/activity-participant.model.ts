import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Activity} from './activity.model';
import {Users} from './users.model';
import {participantStatusEnum} from '../controllers/activities/activity.constant';

@model()
export class ActivityParticipant extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'string',
    default: participantStatusEnum.join,
  })
  status?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string;

  @belongsTo(() => Activity)
  activityId: number;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<ActivityParticipant>) {
    super(data);
  }
}

export interface ActivityParticipantRelations {
  // describe navigational properties here
  user: Users;
}

export type ActivityParticipantWithRelations = ActivityParticipant & ActivityParticipantRelations;
