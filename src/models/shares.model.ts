import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {Posts} from './posts.model';
import {Users, UsersWithRelations} from './users.model';

@model()
export class Shares extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  postShareId?: number;

  @property({
    type: 'string',
    default: '',
  })
  content?: string;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  createdAt?: string;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  updatedAt?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string;

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Posts)
  postId: number;

  constructor(data?: Partial<Shares>) {
    super(data);
  }
}

export interface SharesRelations {
  // describe navigational properties here
  user?: UsersWithRelations;
}

export type SharesWithRelations = Shares & SharesRelations;
