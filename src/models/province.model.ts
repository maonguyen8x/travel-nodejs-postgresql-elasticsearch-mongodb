import {Entity, model, property, hasMany} from '@loopback/repository';
import {Town} from './town.model';

@model()
export class Province extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: false,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  type?: string;

  @property({
    type: 'string',
  })
  slug?: string;

  @property({
    type: 'string',
  })
  name_with_type?: string;

  @hasMany(() => Town)
  towns: Town[];

  constructor(data?: Partial<Province>) {
    super(data);
  }
}

export interface ProvinceRelations {
  // describe navigational properties here
}

export type ProvinceWithRelations = Province & ProvinceRelations;
