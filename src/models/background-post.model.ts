import {Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {MEDIA_CONTENT_TYPE_UPLOAD, SYSTEM_MEDIA_CONTENT_RESOURCE_TYPES} from '../configs/media-contents-constants';

@model()
class BackgroundMediaContent {
  @property({
    type: 'string',
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
}

@model()
export class BackgroundPost extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  color?: string;

  @property({
    type: 'object',
  })
  backgroundPost?: BackgroundMediaContent;

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
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  constructor(data?: Partial<BackgroundPost>) {
    super(data);
  }
}

export interface BackgroundPostRelations {
  // describe navigational properties here
}

export type BackgroundPostWithRelations = BackgroundPost & BackgroundPostRelations;
