import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Users} from './users.model';
import {FOLLOW_STATUS_REQUESTED, FOLLOW_STATUS} from '../configs/follow-constants';
import moment from 'moment';

@model()
export class Follow extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    jsonSchema: {
      enum: FOLLOW_STATUS,
    },
    default: FOLLOW_STATUS_REQUESTED,
  })
  followStatus?: string;

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

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Users)
  followingId: number;

  constructor(data?: Partial<Follow>) {
    super(data);
  }
}

export interface FollowRelations {
  // describe navigational properties here
}

export type FollowWithRelations = Follow & FollowRelations;
