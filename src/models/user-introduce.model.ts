import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Profiles} from './profiles.model';

@model()
export class UserIntroduce extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  introduce?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublic?: boolean;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<UserIntroduce>) {
    super(data);
  }
}

export interface UserIntroduceRelations {
  // describe navigational properties here
}

export type UserIntroduceWithRelations = UserIntroduce & UserIntroduceRelations;
