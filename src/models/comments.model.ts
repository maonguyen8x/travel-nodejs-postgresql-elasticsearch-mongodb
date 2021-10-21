import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import moment from 'moment';
import {ChildComment} from './child-comment.model';
import {Likes} from './likes.model';
import {Posts} from './posts.model';
import {Users, UsersWithRelations} from './users.model';

@model()
export class Comments extends Entity {
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
    type: 'number',
    default: 0,
  })
  totalReply?: number;

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

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Posts)
  postId: number;

  @hasMany(() => Likes, {keyTo: 'commentId'})
  likes: Likes[];

  @hasMany(() => ChildComment, {keyTo: 'commentId'})
  childComments: ChildComment[];

  constructor(data?: Partial<Comments>) {
    super(data);
  }
}

export interface CommentsRelations {
  // describe navigational properties here
  user: UsersWithRelations;
}

export type CommentsWithRelations = Comments & CommentsRelations;
