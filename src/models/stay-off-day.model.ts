import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Service} from './service.model';

@model()
export class StayOffDay extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  date: string;

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

  @belongsTo(() => Service)
  serviceId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [prop: string]: any;

  constructor(data?: Partial<StayOffDay>) {
    super(data);
  }
}

export interface StayOffDayRelations {
  // describe navigational properties here
}

export type StayOffDayWithRelations = StayOffDay & StayOffDayRelations;
