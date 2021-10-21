import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Booking} from './booking.model';
import {Currency} from './currency.model';
import {Stay} from './stay.model';
import {UserInfo} from './tour-reservation.model';

@model()
export class SpecialDay {
  @property({
    type: 'string',
  })
  date: string;

  @property({
    type: 'number',
  })
  price: number;
}

@model()
export class StayMetadata {
  @property({
    type: 'number',
  })
  numOfNight: number;

  @property({
    type: 'number',
  })
  numOfNomalNight: number;

  @property({
    type: 'number',
  })
  numOfWeekendNight: number;

  @property({
    type: 'number',
  })
  totalPriceOfNomalNight: number;

  @property({
    type: 'number',
  })
  totalPriceOfWeekendNight: number;

  @property({
    type: 'number',
  })
  totalFeeIncreaseGuest: number;

  @property({
    type: 'number',
  })
  totalFeeIncreaseAdult: number;

  @property({
    type: 'number',
  })
  totalFeeIncreaseChild: number;

  @property({
    type: 'number',
  })
  totalFeeIncreaseInfant: number;

  @property({
    type: 'number',
  })
  numOfIncreaseAdult: number;

  @property({
    type: 'number',
  })
  numOfIncreaseChild: number;

  @property({
    type: 'number',
  })
  numOfIncreaseInfant: number;

  @property({
    type: 'number',
  })
  price: number;

  @property({
    type: 'number',
  })
  priceWeekend: number;

  @property({
    type: 'number',
  })
  discountLongTermRental: number;

  @property({
    type: 'number',
  })
  discountEarlyBooking: number;

  @property({
    type: 'number',
  })
  discountLastHourBooking: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  specialDays: SpecialDay[];
}

@model()
export class StayReservation extends Entity {
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
    type: 'number',
    required: true,
  })
  numInfant: number;

  @property({
    type: 'string',
  })
  note?: string;

  @property({
    type: 'string',
  })
  purposeTrip?: string;

  @property({
    type: 'string',
  })
  expectedCheckinTime?: string;

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
  metadata: StayMetadata;

  @belongsTo(() => Stay) stayId: number;
  @belongsTo(() => Currency) currencyId: number;
  @belongsTo(() => Booking) bookingId: number;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<StayReservation>) {
    super(data);
  }
}

export interface StayReservationRelations {
  // describe navigational properties here
  booking: Booking;
  stay: Stay;
  currency: Currency;
}

export type StayReservationWithRelations = StayReservation & StayReservationRelations;
