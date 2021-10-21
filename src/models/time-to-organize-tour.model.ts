import {Entity, model, property, belongsTo} from '@loopback/repository';
import {TourTypes} from '../configs/service-constant';
import {Tour} from './tour.model';

@model()
export class TimeToOrganizeTour extends Entity {
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
  startDate: string;

  @property({
    type: 'date',
  })
  endDate?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [TourTypes.holidayTour, TourTypes.normalTour],
    },
  })
  tourType?: string;

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
  deletedAt?: string;

  @belongsTo(() => Tour)
  tourId: number;

  constructor(data?: Partial<TimeToOrganizeTour>) {
    super(data);
  }
}

export interface TimeToOrganizeTourRelations {
  // describe navigational properties here
}

export type TimeToOrganizeTourWithRelations = TimeToOrganizeTour & TimeToOrganizeTourRelations;
