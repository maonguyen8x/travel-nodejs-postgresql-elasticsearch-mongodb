import {Entity, model, property, belongsTo} from '@loopback/repository';
import {AmenityNameObject, AmenityCategory} from './amenity-category.model';
import {MEDIA_CONTENT_TYPE_UPLOAD, SYSTEM_MEDIA_CONTENT_RESOURCE_TYPES} from '../configs/media-contents-constants';

@model()
class AmenityIcon {
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
export class Amenity extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'object',
    required: true,
  })
  name: AmenityNameObject;

  @property({
    type: 'object',
  })
  icon?: AmenityIcon;

  @property({
    type: 'string',
    required: true,
  })
  keyword: string;

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

  @belongsTo(() => AmenityCategory)
  amenityCategoryId: number;

  constructor(data?: Partial<Amenity>) {
    super(data);
  }
}

export interface AmenityRelations {
  // describe navigational properties here
}

export type AmenityWithRelations = Amenity & AmenityRelations;
