import {belongsTo, Entity, model, property, hasOne, hasMany} from '@loopback/repository';
import {Page} from './page.model';
import {Currency} from './currency.model';
import {Posts} from './posts.model';
import {ServiceFlagEnum, ServiceStatusEnum, ServiceTypesEnum} from '../configs/service-constant';
import {Tour} from './tour.model';
import {Stay} from './stay.model';
import {StaySpecialDayPrice} from './stay-special-day-price.model';
import {StayOffDay} from './stay-off-day.model';
import {ServiceReview} from './service-review.model';

@model({settings: {strict: true}})
export class Service extends Entity {
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
    required: true,
    jsonSchema: {
      enum: [ServiceTypesEnum.food, ServiceTypesEnum.stay, ServiceTypesEnum.tour],
    },
  })
  type: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [ServiceStatusEnum.draft, ServiceStatusEnum.public],
    },
    default: ServiceStatusEnum.public,
  })
  status?: string;

  @property({
    type: 'number',
    required: true,
    default: ServiceFlagEnum.normal,
  })
  flag: number;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      maximum: 999999999,
      minimum: 0,
    },
  })
  price: number;

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
  @belongsTo(() => Currency) currencyId: number;
  @belongsTo(() => Posts) postId: number;
  @hasOne(() => Tour, {keyTo: 'serviceId'}) tour: Tour;

  @hasOne(() => Stay) stay: Stay;
  @hasMany(() => StaySpecialDayPrice, {keyTo: 'serviceId'})
  specialDayPrices: StaySpecialDayPrice[];

  @hasMany(() => StayOffDay, {keyTo: 'serviceId'})
  offDays: StaySpecialDayPrice[];

  @hasMany(() => ServiceReview, {keyTo: 'serviceId'})
  serviceReview: ServiceReview[];
  // @hasMany(() => Attachments) attachments: Attachments[];

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [prop: string]: any;

  constructor(data?: Partial<Service>) {
    super(data);
  }
}

export interface ServiceRelations {
  // describe navigational properties here
  page: Page;
  currency: Currency;
  // attachments: Attachments[],
  post?: Posts;
}

export type ServiceWithRelations = Service & ServiceRelations;
