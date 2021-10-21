import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Currency} from './currency.model';

@model()
export class Price extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  product?: string;

  @property({
    type: 'number',
  })
  value?: number;

  @belongsTo(() => Currency)
  currencyId: number;

  constructor(data?: Partial<Price>) {
    super(data);
  }
}

export interface PriceRelations {
  // describe navigational properties here
}

export type PriceWithRelations = Price & PriceRelations;
