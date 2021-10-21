import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Users} from './users.model';
import {Tour, TotalTourTimeObject} from './tour.model';
import {Currency} from './currency.model';
import {Booking} from './booking.model';

@model()
export class UserInfo {
  @property()
  name: string;

  @property()
  nationality: string;

  @property()
  email: string;

  @property()
  phone: string;
}

@model()
export class TimeOrganizeMetadata {
  @property() id?: number;
  @property() startDate?: string;
  @property() endDate?: string;
  @property() tourType?: string;
}

@model()
export class TourMetadata {
  @property() id?: number;
  @property() name?: string;
  @property() totalTourTime?: TotalTourTimeObject;
  @property() normalAdultPrice?: number;
  @property() normalChildPrice?: number;
  @property() holidayAdultPrice?: number;
  @property() holidayChildPrice?: number;
  @property({
    type: 'array',
    itemType: 'string',
  })
  holidays?: string[];
  @property() isDailyTour?: boolean;
  @property({
    type: 'object',
  })
  timeOrganize?: TimeOrganizeMetadata;
}

@model()
export class TourReservation extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    unique: true,
  })
  reservationCode: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  numAdult: number;

  @property({
    type: 'number',
    required: true,
  })
  numChildren: number;

  @property({
    type: 'string',
    required: true,
  })
  pickUpPoint: string;

  @property({
    type: 'string',
    required: true,
  })
  dropOffPoint: string;

  @property({
    type: 'string',
  })
  note?: string;

  @property({
    type: 'object',
    required: true,
  })
  userInfo: UserInfo;

  @property({
    type: 'object',
  })
  otherUserInfo?: UserInfo;

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

  @property({
    type: 'date',
  })
  startDate: string;

  @property({
    type: 'date',
  })
  endDate: string;

  @property({
    type: 'object',
  })
  metadata: TourMetadata;

  @belongsTo(() => Tour) tourId: number;
  @belongsTo(() => Currency) currencyId: number;
  @belongsTo(() => Booking) bookingId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  constructor(data?: Partial<TourReservation>) {
    super(data);
  }
}

export interface TourReservationRelations {
  // describe navigational properties here
  createdBy: Users;
  tour: Tour;
  currency: Currency;
  booking: Booking;
}

export type TourReservationWithRelations = TourReservation & TourReservationRelations;
