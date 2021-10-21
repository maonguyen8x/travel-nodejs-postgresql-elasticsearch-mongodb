import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';
import {USER_GENDER_CONSTANTS, USER_GENDER_UNSPECIFIED} from '../configs/user-constants';

@model()
export class UserGender extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    jsonSchema: {
      enum: USER_GENDER_CONSTANTS,
    },
    default: USER_GENDER_UNSPECIFIED,
  })
  gender?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserGender>) {
    super(data);
  }
}

export interface UserGenderRelations {
  // describe navigational properties here
}

export type UserGenderWithRelations = UserGender & UserGenderRelations;
