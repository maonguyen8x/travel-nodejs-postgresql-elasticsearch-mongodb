import {Entity, model, property, belongsTo} from '@loopback/repository';
import {MediaContents} from './media-contents.model';
import {Service} from './service.model';
import {Currency} from './currency.model';
import {AccommodationType} from './accommodation-type.model';
import {Page} from './page.model';
import {ServiceStatusEnum} from '../configs/service-constant';
import {Posts} from './posts.model';
import {StaySpecialDayPrice} from './stay-special-day-price.model';
import {StayOffDay} from './stay-off-day.model';

@model()
export class ModelFilterStayClass {
  @property({
    type: 'string',
  })
  amenities?: string;

  @property({
    type: 'string',
  })
  facilities?: string;

  @property({
    type: 'number',
  })
  numberOfBedroom?: number;

  @property({
    type: 'number',
  })
  numberOfBed?: number;

  @property({
    type: 'number',
  })
  coordinates?: number;

  @property({
    type: 'number',
  })
  distance?: number;

  @property({
    type: 'number',
  })
  stayPropertytypeId: number;

  @property({
    type: 'number',
  })
  price?: number;

  @property({
    type: 'number',
  })
  pageId?: number;

  @property({
    type: 'number',
  })
  priceWeekend?: number;

  @property({
    type: 'number',
  })
  accommodationTypeId?: number;
}

@model()
export class StayRules {
  @property({
    type: 'string',
  })
  smoking?: string;

  @property({
    type: 'string',
  })
  pet?: string;

  @property({
    type: 'string',
  })
  party?: string;

  @property({
    type: 'string',
  })
  cooking?: string;

  @property({
    type: 'string',
  })
  commercialPhoto?: string;

  @property({
    type: 'boolean',
  })
  agreeRules?: boolean;

  @property({
    type: 'boolean',
  })
  depositRequired?: boolean;

  @property({
    type: 'boolean',
  })
  avoidMakingNoises?: boolean;

  @property({
    type: 'boolean',
  })
  noShoesInHouse?: boolean;

  @property({
    type: 'boolean',
  })
  noSmokingInSharedSpaces?: boolean;

  @property({
    type: 'string',
  })
  otherRules?: string;
}

@model()
export class Stay extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  introduction?: string;

  @property({
    type: 'string',
  })
  acreage?: string;

  @property({
    type: 'number',
  })
  numberOfBedroom?: number;

  @property({
    type: 'number',
  })
  numberOfBed?: number;

  @property({
    type: 'number',
  })
  numberOfSingleBed?: number;

  @property({
    type: 'number',
  })
  numberOfDoubleBed?: number;

  @property({
    type: 'number',
  })
  numberOfLargeDoubleBed?: number;

  @property({
    type: 'number',
  })
  numberOfLargeBed?: number;

  @property({
    type: 'number',
  })
  numberOfSuperLargeBed?: number;

  @property({
    type: 'number',
  })
  numberOfMattress?: number;

  @property({
    type: 'number',
  })
  numberOfSofa?: number;

  @property({
    type: 'number',
  })
  numberOfBunk?: number;

  @property({
    type: 'number',
  })
  numberOfBathroom?: number;

  @property({
    type: 'number',
  })
  numberOfPrivateBathroom?: number;

  @property({
    type: 'number',
  })
  numberOfSharedBathroom?: number;

  @property({
    type: 'number',
  })
  numberOfKitchen?: number;

  @property({
    type: 'number',
  })
  numberOfPrivateKitchen?: number;

  @property({
    type: 'number',
  })
  numberOfSharedKitchen?: number;

  @property({
    type: 'array',
    itemType: 'string',
  })
  amenities?: string[];

  @property({
    type: 'array',
    itemType: 'string',
  })
  facilities?: string[];

  @property({
    type: 'object',
  })
  rules?: StayRules;

  @property({
    type: 'array',
    itemType: 'number',
  })
  mediaContentIds?: number[];

  @property({
    type: 'number',
  })
  numberOfStandardGuest?: number;

  @property({
    type: 'number',
  })
  maxNumberOfGuest?: number;

  @property({
    type: 'number',
  })
  numberOfAdult?: number;

  @property({
    type: 'number',
  })
  numberOfChild?: number;

  @property({
    type: 'number',
  })
  numberOfInfant?: number;

  @property({
    type: 'number',
  })
  price?: number;

  @property({
    type: 'number',
  })
  priceWeekend?: number;

  @property({
    type: 'number',
  })
  feeIncreaseAdult?: number;

  @property({
    type: 'number',
  })
  feeIncreaseChild?: number;

  @property({
    type: 'number',
  })
  feeIncreaseInfant?: number;

  @property({
    type: 'number',
  })
  feeCleaning?: number;

  @property({
    type: 'number',
  })
  discountWeeklyRental?: number;

  @property({
    type: 'number',
  })
  discountMonthlyRental?: number;

  @property({
    type: 'number',
  })
  discountYearlyRental?: number;

  @property({
    type: 'number',
  })
  discountEarlyBooking?: number;

  @property({
    type: 'number',
  })
  discountLastHourBooking?: number;

  @property({
    type: 'number',
  })
  discountEarlyBookingDay?: number;

  @property({
    type: 'string',
  })
  discountLastHourBookingTime?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [ServiceStatusEnum.draft, ServiceStatusEnum.public],
    },
    default: ServiceStatusEnum.public,
  })
  status?: string;

  @property({
    type: 'boolean',
    default: true,
  })
  maxGuestIncludeChildAndInfant: boolean;

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

  @belongsTo(() => AccommodationType)
  accommodationTypeId: number;

  constructor(data?: Partial<Stay>) {
    super(data);
  }
}

export interface StayRelations {
  // describe navigational properties here
  mediaContents?: MediaContents[];
  page?: Page;
  currency: Currency;
  service?: Service;
  accommodationType: AccommodationType;
  post?: Posts;
  currencyId?: number;
  specialDayPrices?: StaySpecialDayPrice[];
  offDays?: StayOffDay[];
  averagePointStay?: number;
}

export type StayWithRelations = Stay & StayRelations;
