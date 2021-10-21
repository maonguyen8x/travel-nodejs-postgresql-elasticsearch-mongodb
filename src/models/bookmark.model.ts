import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {Posts, PostsWithRelations} from './posts.model';
import {Users} from './users.model';

@model()
export class Bookmark extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

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

  constructor(data?: Partial<Bookmark>) {
    super(data);
  }
}

export interface BookmarkRelations {
  // describe navigational properties here
  post: PostsWithRelations;
}

export type BookmarkWithRelations = Bookmark & BookmarkRelations;
