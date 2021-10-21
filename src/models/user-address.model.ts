import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';

@model()
export class UserAddress extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  address?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserAddress>) {
    super(data);
  }
}

export interface UserAddressRelations {
  // describe navigational properties here
}

export type UserAddressWithRelations = UserAddress & UserAddressRelations;
