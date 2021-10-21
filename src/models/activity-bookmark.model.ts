import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Activity} from './activity.model';
import {Users} from './users.model';

@model()
export class ActivityBookmark extends Entity {
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
    type: 'date',
  })
  deletedAt?: string;

  @belongsTo(() => Activity)
  activityId: number;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<ActivityBookmark>) {
    super(data);
  }
}

export interface ActivityBookmarkRelations {
  // describe navigational properties here
}

export type ActivityBookmarkWithRelations = ActivityBookmark & ActivityBookmarkRelations;
