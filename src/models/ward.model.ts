import {Entity, model, property} from '@loopback/repository';

@model()
export class Ward extends Entity {
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
  townId?: number;

  constructor(data?: Partial<Ward>) {
    super(data);
  }
}

export interface WardRelations {
  // describe navigational properties here
}

export type WardWithRelations = Ward & WardRelations;
