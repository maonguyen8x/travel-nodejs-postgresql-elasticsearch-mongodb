import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';

@model()
export class UserPhone extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserPhone>) {
    super(data);
  }
}

export interface UserPhoneRelations {
  // describe navigational properties here
}

export type UserPhoneWithRelations = UserPhone & UserPhoneRelations;
