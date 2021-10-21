import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Page} from './page.model';
import {ServiceDetailResponseInterface} from '../controllers/services/service.constant';

@model()
export class AccommodationType extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    minLength: 3,
  })
  name: string;

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

  @belongsTo(() => Page) pageId: number;

  constructor(data?: Partial<AccommodationType>) {
    super(data);
  }
}

export interface AccommodationTypeRelations {
  // describe navigational properties here
  stays: ServiceDetailResponseInterface[];
  total?: number;
  numOfAvailable?: number;
}

export type AccommodationTypeWithRelations = AccommodationType & AccommodationTypeRelations;
