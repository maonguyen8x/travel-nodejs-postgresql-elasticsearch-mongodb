import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';

@model()
export class UserWebsite extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  website?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserWebsite>) {
    super(data);
  }
}

export interface UserWebsiteRelations {
  // describe navigational properties here
}

export type UserWebsiteWithRelations = UserWebsite & UserWebsiteRelations;
