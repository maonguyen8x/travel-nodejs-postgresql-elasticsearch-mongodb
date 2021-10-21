import {Entity, model, property} from '@loopback/repository';
import moment from 'moment';

@model()
export class StaticPage extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  alias: string;

  @property({
    type: 'string',
    required: true,
  })
  content: string;

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

  constructor(data?: Partial<StaticPage>) {
    super(data);
  }
}

export interface StaticPageRelations {
  // describe navigational properties here
}

export type StaticPageWithRelations = StaticPage & StaticPageRelations;
