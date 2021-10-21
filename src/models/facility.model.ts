import {Entity, model, property, belongsTo} from '@loopback/repository';
import {FacilityCategory, FacilityNameObject} from './facility-category.model';

@model()
export class Facility extends Entity {
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

  @belongsTo(() => FacilityCategory)
  facilityCategoryId: number;

  constructor(data?: Partial<Facility>) {
    super(data);
  }
}

export interface FacilityRelations {
  // describe navigational properties here
}

export type FacilityWithRelations = Facility & FacilityRelations;
