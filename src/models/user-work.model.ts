import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';

@model()
export class UserWork extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  work?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserWork>) {
    super(data);
  }
}

export interface UserWorkRelations {
  // describe navigational properties here
}

export type UserWorkWithRelations = UserWork & UserWorkRelations;
