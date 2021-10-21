import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {Locations} from './locations.model';
import {Posts, PostsWithRelations} from './posts.model';
import {Users} from './users.model';
import {Currency} from './currency.model';
import {ActivityStatusEnum} from '../controllers/activities/activity.constant';
import {ActivityParticipant} from './activity-participant.model';
import {ActivityInvitee} from './activity-invitee.model';
import moment from 'moment';

@model()
export class Activity extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'date',
    required: true,
  })
  from?: string;

  @property({
    type: 'date',
  })
  to?: string;

  @property({
    type: 'number',
  })
  price?: number;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [ActivityStatusEnum.draft, ActivityStatusEnum.public],
    },
  })
  status: string;

  @belongsTo(() => Locations)
  locationId: number;

  @belongsTo(() => Posts)
  postId: number;

  @belongsTo(() => Users)
  createdById: number;

  @belongsTo(() => Currency)
  currencyId: number;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  createdAt?: string;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  updatedAt?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string | null;

  @property({
    type: 'date',
  })
  blockedAt?: string | null;

  @property({
    type: 'string',
  })
  blockMessage?: string | null;

  @hasMany(() => ActivityParticipant)
  activityParticipants: ActivityParticipant[];

  @hasMany(() => ActivityInvitee)
  activityInvitees: ActivityInvitee[];

  constructor(data?: Partial<Activity>) {
    super(data);
  }
}

export interface ActivityRelations {
  // describe navigational properties here
  currency?: Currency;
  location?: Locations;
  post?: PostsWithRelations;
}

export type ActivityWithRelations = Activity & ActivityRelations;
