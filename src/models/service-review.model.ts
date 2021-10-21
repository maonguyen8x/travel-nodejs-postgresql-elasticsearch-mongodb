import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Booking} from './booking.model';
import {Posts} from './posts.model';
import {Service, ServiceWithRelations} from './service.model';
import {Users} from './users.model';

@model()
export class ServiceReview extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'boolean',
  })
  isActive: boolean;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      minimum: 0,
      maximum: 100,
    },
  })
  point: number;

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

  @belongsTo(() => Users) createdById: number;
  @belongsTo(() => Service) serviceId: number;
  @belongsTo(() => Posts) postId: number;
  @belongsTo(() => Booking) bookingId: number;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [prop: string]: any;

  constructor(data?: Partial<ServiceReview>) {
    super(data);
  }
}

export interface ServiceReviewRelations {
  // describe navigational properties here
  service?: ServiceWithRelations;
}

export type ServiceReviewWithRelations = ServiceReview & ServiceReviewRelations;
