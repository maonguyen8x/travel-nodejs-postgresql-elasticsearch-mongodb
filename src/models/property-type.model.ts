import {Entity, model, property} from '@loopback/repository';

@model()
export class MultiLang {
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
export class PropertyType extends Entity {
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
  name: MultiLang;

  @property({
    type: 'object',
  })
  description?: MultiLang;

  @property({
    type: 'string',
    required: true,
  })
  keyword: string;

  @property({
    type: 'string',
  })
  status?: string;

  constructor(data?: Partial<PropertyType>) {
    super(data);
  }
}

export interface PropertyTypeRelations {
  // describe navigational properties here
}

export type PropertyTypeWithRelations = PropertyType & PropertyTypeRelations;
