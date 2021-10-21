import {Entity, model, property, hasMany} from '@loopback/repository';
import {Amenity} from './amenity.model';

@model()
export class AmenityNameObject {
  @property({
    type: 'string',
  })
  en: string;

  @property({
    type: 'string',
  })
  vi: string;
}

@model()
export class AmenityCategory extends Entity {
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

  @hasMany(() => Amenity)
  amenities: Amenity[];

  constructor(data?: Partial<AmenityCategory>) {
    super(data);
  }
}

export interface AmenityCategoryRelations {
  // describe navigational properties here
}

export type AmenityCategoryWithRelations = AmenityCategory & AmenityCategoryRelations;
