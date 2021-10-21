import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import moment from 'moment';
import {Comments} from './comments.model';
import {Likes} from './likes.model';
import {Users, UsersWithRelations} from './users.model';

@model()
export class ChildComment extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  content?: string;

  @property({
    type: 'number',
    default: 0,
  })
  totalLike?: number;

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

  @belongsTo(() => Comments)
  commentId: number;

  @belongsTo(() => Users)
  userId: number;

  @hasMany(() => Likes)
  likes: Likes[];

  constructor(data?: Partial<ChildComment>) {
    super(data);
  }
}

export interface ChildCommentRelations {
  // describe navigational properties here
  user: UsersWithRelations;
}

export type ChildCommentWithRelations = ChildComment & ChildCommentRelations;
