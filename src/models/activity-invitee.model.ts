import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Activity} from './activity.model';
import {Users} from './users.model';
import {participantStatusEnum} from '../controllers/activities/activity.constant';

@model()
export class ActivityInvitee extends Entity {
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
    default: participantStatusEnum.invited,
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

  constructor(data?: Partial<ActivityInvitee>) {
    super(data);
  }
}

export interface ActivityInviteeRelations {
  // describe navigational properties here
  user: Users;
}

export type ActivityInviteeWithRelations = ActivityInvitee & ActivityInviteeRelations;
