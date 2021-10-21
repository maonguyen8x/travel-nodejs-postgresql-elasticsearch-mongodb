import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Users} from './users.model';

@model()
export class UserEmail extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  email?: string;

  @property({
    type: 'string',
  })
  identityApple?: string;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isPublic: boolean;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<UserEmail>) {
    super(data);
  }
}

export interface UserEmailRelations {
  // describe navigational properties here
  user: Users;
}

export type UserEmailWithRelations = UserEmail & UserEmailRelations;
