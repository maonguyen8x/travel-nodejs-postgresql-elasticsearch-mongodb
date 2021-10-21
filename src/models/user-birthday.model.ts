import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';

@model()
export class UserBirthday extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
  })
  birthday: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserBirthday>) {
    super(data);
  }
}

export interface UserBirthdayRelations {
  // describe navigational properties here
}

export type UserBirthdayWithRelations = UserBirthday & UserBirthdayRelations;
