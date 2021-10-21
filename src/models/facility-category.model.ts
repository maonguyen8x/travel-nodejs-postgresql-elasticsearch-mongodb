import {Entity, model, property, hasMany} from '@loopback/repository';
import {Facility} from './facility.model';

@model()
export class FacilityNameObject {
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
export class FacilityCategory extends Entity {
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
  name: FacilityNameObject;

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

  @hasMany(() => Facility)
  facilities: Facility[];

  constructor(data?: Partial<FacilityCategory>) {
    super(data);
  }
}

export interface FacilityCategoryRelations {
  // describe navigational properties here
}

export type FacilityCategoryWithRelations = FacilityCategory & FacilityCategoryRelations;
