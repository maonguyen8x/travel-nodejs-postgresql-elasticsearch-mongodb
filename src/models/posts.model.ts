import {belongsTo, Entity, hasMany, model, property, hasOne} from '@loopback/repository';
import moment from 'moment';
import {Bookmark} from './bookmark.model';
import {Comments} from './comments.model';
import {Likes} from './likes.model';
import {Locations, LocationsWithRelations} from './locations.model';
import {MediaContents} from './media-contents.model';
import {Rankings} from './rankings.model';
import {Shares} from './shares.model';
import {Users, UsersWithRelations} from './users.model';
import {
  MEDIA_PREVIEW_TYPES,
  MEDIA_PREVIEW_TYPES_NONE,
  POST_ACCESS_TYPE_PUBLIC,
  POST_ACCESS_TYPES,
  POST_TYPE_CREATED,
  POST_TYPES,
  PostStatusEnum,
} from '../configs/post-constants';
import {MEDIA_CONTENT_TYPE_UPLOAD, SYSTEM_MEDIA_CONTENT_RESOURCE_TYPES} from '../configs/media-contents-constants';
import {Page, PageRelations} from './page.model';
import {Service} from './service.model';
import {Plan} from './plan.model';
import {TaskWithRelations} from './task.model';
import {Activity} from './activity.model';

@model()
export class PlanPostMetadata {
  @property({
    type: 'array',
    itemType: 'object',
  })
  tasks?: TaskWithRelations[];

  @property({
    type: 'string',
  })
  planName?: string;

  @property({
    type: 'date',
  })
  startDate?: string;

  @property({
    type: 'date',
  })
  endDate?: string;
}

@model()
export class MetadataPost {
  @property({
    type: 'array',
    itemType: 'object',
  })
  hadCameLocations?: Locations[];

  @property({
    type: 'object',
  })
  plan?: PlanPostMetadata;

  @property({
    type: 'string',
  })
  color?: string;
}

@model()
export class BackgroundPostWithColor {
  @property({
    type: 'string',
    required: true,
  })
  url: string;

  @property({
    type: 'string',
  })
  urlBlur: string;

  @property({
    type: 'string',
  })
  urlTiny: string;

  @property({
    type: 'string',
  })
  urlOptimize: string;

  @property({
    type: 'string',
  })
  urlBackground?: string;

  @property({
    type: 'string',
  })
  metadata: string;

  @property({
    type: 'string',
  })
  publicId: string;

  @property({
    type: 'string',
  })
  format: string;

  @property({
    type: 'string',
    default: MEDIA_CONTENT_TYPE_UPLOAD,
  })
  mediaType: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: SYSTEM_MEDIA_CONTENT_RESOURCE_TYPES,
    },
  })
  resourceType: string;

  @property({
    type: 'string',
  })
  fileName: string;

  @property({
    type: 'string',
  })
  path: string;

  @property({
    type: 'string',
  })
  color?: string;
}

@model()
export class Posts extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  medias?: string;

  @property({
    type: 'string',
  })
  content?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: POST_TYPES,
    },
    default: POST_TYPE_CREATED,
  })
  postType?: string;

  @property({
    type: 'boolean',
    default: true,
  })
  showOnProfile?: boolean;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [PostStatusEnum.public, PostStatusEnum.draft],
    },
    default: PostStatusEnum.public,
  })
  status?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: POST_ACCESS_TYPES,
    },
    default: POST_ACCESS_TYPE_PUBLIC,
  })
  accessType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: MEDIA_PREVIEW_TYPES,
    },
    default: MEDIA_PREVIEW_TYPES_NONE,
  })
  firstMediaType?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublicLocation?: boolean;

  @property({
    type: 'boolean',
    default: true,
  })
  isPublicPlan?: boolean;

  @property({
    type: 'object',
  })
  backgroundPost?: BackgroundPostWithColor;

  @property({
    type: 'number',
    default: 0,
  })
  averagePoint?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalLike?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalRanking?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalShare?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalComment?: number;

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

  @property({
    type: 'date',
  })
  blockedAt?: string | null;

  @property({
    type: 'string',
  })
  blockMessage?: string | null;

  @property({
    type: 'string',
  })
  listUsersReceiveNotifications?: string;

  @property({
    type: 'object',
  })
  metadata?: MetadataPost;

  @belongsTo(() => Users)
  creatorId: number;

  @hasMany(() => Likes, {keyTo: 'postId'})
  likes: Likes[];

  @belongsTo(() => Locations)
  locationId: number;

  @hasMany(() => Rankings, {keyTo: 'postId'})
  rankings: Rankings[];

  @hasMany(() => Shares, {keyTo: 'postId'})
  shares: Shares[];

  @hasMany(() => MediaContents, {keyTo: 'postId'})
  mediaContents: MediaContents[];

  @hasMany(() => Comments, {keyTo: 'postId'})
  comments: Comments[];

  @belongsTo(() => Posts)
  sourcePostId: number;

  @hasMany(() => Bookmark, {keyTo: 'postId'})
  bookmarks: Bookmark[];

  @belongsTo(() => Page)
  pageId: number;

  @belongsTo(() => Plan)
  planId: number;

  @hasOne(() => Service, {keyTo: 'postId'}) service: Service;

  @hasOne(() => Activity, {keyTo: 'postId'})
  activity: Activity;

  constructor(data?: Partial<Posts>) {
    super(data);
  }
}

export interface PostsRelations {
  // describe navigational properties here
  sourcePost: PostsWithRelations;
  service: Service;
  page: Page & PageRelations;
  liked?: boolean;
  creator?: UsersWithRelations;
  plan: PlanPostMetadata;
  location: LocationsWithRelations;
}

export type PostsWithRelations = Posts & PostsRelations;
