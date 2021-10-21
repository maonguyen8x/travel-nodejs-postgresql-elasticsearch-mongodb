import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Users} from './users.model';
import {Page, PageWithRelations} from './page.model';
import {Posts, PostsWithRelations} from './posts.model';

@model()
export class PageReview extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 0,
      maximum: 100,
    },
  })
  point: number;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string | null;

  @belongsTo(() => Page) pageId: number;
  @belongsTo(() => Users) createdById: number;
  @belongsTo(() => Posts) postId: number;

  constructor(data?: Partial<PageReview>) {
    super(data);
  }
}

export interface PageReviewRelations {
  // describe navigational properties here
  post: Partial<PostsWithRelations>;
  page?: PageWithRelations;
}

export type PageReviewWithRelations = PageReview & PageReviewRelations;
