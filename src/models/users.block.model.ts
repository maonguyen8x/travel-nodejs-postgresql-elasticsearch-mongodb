import {Entity, model, property, belongsTo} from '@loopback/repository';

import {Users} from './users.model';

@model()
export class UsersBlock extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;
  //
  // @property({
  //   type: 'date',
  //   default: moment().utc().toISOString(),
  // })
  // createdAt?: string;
  //
  // @property({
  //   type: 'date',
  //   default: moment().utc().toISOString(),
  // })
  // updatedAt?: string;

  @belongsTo(() => Users) creatorId: number;

  @belongsTo(() => Users) userId: number;

  constructor(data?: Partial<UsersBlock>) {
    super(data);
  }
}

export interface UsersBlockRelations {
  // describe navigational properties here
  user: Users;
}

export type UsersBlockWithRelations = UsersBlock & UsersBlockRelations;
