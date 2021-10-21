import {Entity, model, property, hasMany} from '@loopback/repository';
import {Ward} from './ward.model';

@model()
export class Town extends Entity {
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

  @property({
    type: 'string',
  })
  path?: string;

  @property({
    type: 'string',
  })
  path_with_type?: string;

  @property({
    type: 'number',
  })
  provinceId?: number;

  @hasMany(() => Ward)
  wards: Ward[];

  constructor(data?: Partial<Town>) {
    super(data);
  }
}

export interface TownRelations {
  // describe navigational properties here
}

export type TownWithRelations = Town & TownRelations;
