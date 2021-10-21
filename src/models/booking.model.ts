import {Entity, model, property, belongsTo, hasOne} from '@loopback/repository';
import {TourReservation} from './tour-reservation.model';
import {Currency} from './currency.model';
import {Users} from './users.model';
import {BookingStatusEnum, BookingTypeEnum, PayMethodEnum, RoleTypeEnum} from '../controllers/booking/booking.constant';
import {Page} from './page.model';
import {Service} from './service.model';
import {StayReservation} from './stay-reservation.model';
import {ServiceReview} from './service-review.model';

@model()
export class Booking extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  totalPrice: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [PayMethodEnum.postpaid],
    },
  })
  payMethod: string;

  @property({
    type: 'string',
    required: true,
    unique: true,
  })
  bookingCode: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [
        BookingStatusEnum.request,
        BookingStatusEnum.confirmed,
        BookingStatusEnum.canceled,
        BookingStatusEnum.completed,
      ],
    },
  })
  status: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [BookingTypeEnum.tour, BookingTypeEnum.stay],
    },
  })
  type: string;

  @property({
    type: 'string',
  })
  reasonCancelation: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [RoleTypeEnum.system, RoleTypeEnum.page, RoleTypeEnum.user],
    },
  })
  cancelBy?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  hasReviewed?: boolean;

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

  // @hasOne(() => Page, {keyTo: 'relatedUserId'})
  // page: Page;
  @hasOne(() => TourReservation, {keyTo: 'bookingId'})
  tourReservation: TourReservation;
  @hasOne(() => StayReservation, {keyTo: 'bookingId'})
  stayReservation: StayReservation;
  @belongsTo(() => Currency) currencyId: number;
  @belongsTo(() => Users) createdById: number;
  @belongsTo(() => Page) pageId: number;
  @belongsTo(() => Service) serviceId: number;
  @belongsTo(() => Users) actById: number;
  @hasOne(() => ServiceReview, {keyTo: 'bookingId'})
  serviceReviewItem: ServiceReview;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  constructor(data?: Partial<Booking>) {
    super(data);
  }
}

export interface BookingRelations {
  // describe navigational properties here
  stayReservation: StayReservation;
  tourReservation: TourReservation;
  serviceReviewItem: ServiceReview;
  currency: Currency;
  createdBy: Users;
  page: Page;
  service: Service;
  actBy: Users;
}

export type BookingWithRelations = Booking & BookingRelations;
