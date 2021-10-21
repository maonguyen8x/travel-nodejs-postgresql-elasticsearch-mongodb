import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Posts} from './posts.model';
import {Users} from './users.model';
import {MEDIA_CONTENT_TYPE_UPLOAD, SYSTEM_MEDIA_CONTENT_RESOURCE_TYPES} from '../configs/media-contents-constants';
import moment from 'moment';

@model()
export class MediaContents extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  url: string;

  @property({
    type: 'string',
  })
  urlBlur?: string;

  @property({
    type: 'string',
  })
  urlTiny?: string;

  @property({
    type: 'string',
  })
  urlOptimize?: string;

  @property({
    type: 'string',
  })
  urlBackground?: string;

  @property({
    type: 'string',
  })
  metadata?: string;

  @property({
    type: 'string',
  })
  publicId: string;

  @property({
    type: 'string',
  })
  format?: string;

  @property({
    type: 'string',
    default: MEDIA_CONTENT_TYPE_UPLOAD,
  })
  mediaType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: SYSTEM_MEDIA_CONTENT_RESOURCE_TYPES,
    },
  })
  resourceType?: string;

  @property({
    type: 'string',
  })
  fileName?: string;

  @property({
    type: 'string',
  })
  path?: string;

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

  @belongsTo(() => Posts)
  postId: number;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<MediaContents>) {
    super(data);
  }
}

export interface MediaContentsRelations {
  // describe navigational properties here
}

export type MediaContentsWithRelations = MediaContents & MediaContentsRelations;
