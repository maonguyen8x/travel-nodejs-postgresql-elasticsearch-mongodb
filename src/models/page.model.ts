import {Entity, model, property, belongsTo, hasOne, hasMany} from '@loopback/repository';
import {PageTypesEnum} from '../configs/page-constant';
import {PageVerification} from './page-verification.model';
import {PropertyType} from './property-type.model';
import {AccommodationType} from './accommodation-type.model';
import {
  PageBookingTypeEnum,
  PageCancellationPolicyEnum,
  PageCheckinMethodEnum,
  PageRentalTypeEnum,
  TypeOfRestaurantEnum,
} from '../controllers/pages/page.constant';
import {PayMethodEnum} from '../controllers/booking/booking.constant';
import {Currency} from './currency.model';
import {Locations} from './locations.model';
import {Users} from './users.model';
import {MediaContents} from './media-contents.model';

@model()
export class StayGeneralInformation {
  @property({
    type: 'string',
    jsonSchema: {
      enum: [PageBookingTypeEnum.quickBooking, PageBookingTypeEnum.confirmBooking],
    },
    default: PageBookingTypeEnum.confirmBooking,
  })
  bookingType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [PageRentalTypeEnum.fullHouse, PageRentalTypeEnum.privateRoom, PageRentalTypeEnum.shareRoom],
    },
    default: PageRentalTypeEnum.privateRoom,
  })
  rentalType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [
        PageCancellationPolicyEnum.average,
        PageCancellationPolicyEnum.flexible,
        PageCancellationPolicyEnum.strict,
      ],
    },
    default: PageCancellationPolicyEnum.average,
  })
  cancellationPolicy?: string;

  @property({
    type: 'string',
  })
  checkinTime?: string;

  @property({
    type: 'string',
  })
  checkoutTime?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [PageCheckinMethodEnum.selfCheckin, PageCheckinMethodEnum.contactHost, PageCheckinMethodEnum.reception],
    },
    default: PageCheckinMethodEnum.selfCheckin,
  })
  checkinMethod?: string;

  @property({
    type: 'string',
  })
  checkoutGuide?: string;

  @property({
    type: 'string',
  })
  convenientUserGuide?: string;

  @property({
    type: 'array',
    itemType: 'string',
  })
  language?: string[];

  @property({
    type: 'array',
    itemType: 'string',
    jsonSchema: {
      enum: [PayMethodEnum.postpaid],
    },
  })
  payMethod?: string[];

  @property({
    type: 'string',
  })
  famousPlace?: string;

  @property({
    type: 'string',
  })
  cuisine?: string;

  @property({
    type: 'string',
  })
  shopping?: string;

  @property({
    type: 'string',
  })
  entertainment?: string;

  @property({
    type: 'string',
  })
  sports?: string;

  @property({
    type: 'string',
  })
  urbanArea?: string;

  @property({
    type: 'string',
  })
  departments?: string;

  @property({
    type: 'string',
  })
  medical?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  accommodationTypes?: AccommodationType[];
}

@model()
export class BusinessHoursObject {
  @property({
    type: 'boolean',
  })
  open247: boolean;

  @property({
    type: 'date',
  })
  from: string;

  @property({
    type: 'date',
  })
  to: string;
}

@model()
export class FoodGeneralInformation {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [
        TypeOfRestaurantEnum.coffeeDessert,
        TypeOfRestaurantEnum.restaurant,
        TypeOfRestaurantEnum.setMenuService,
        TypeOfRestaurantEnum.aLacarte,
        TypeOfRestaurantEnum.buffet,
        TypeOfRestaurantEnum.banquetHall,
        TypeOfRestaurantEnum.weddingRestaurant,
        TypeOfRestaurantEnum.fastFood,
        TypeOfRestaurantEnum.snacks,
        TypeOfRestaurantEnum.takeAway,
        TypeOfRestaurantEnum.barBeerClub,
        TypeOfRestaurantEnum.other,
      ],
    },
    default: TypeOfRestaurantEnum.coffeeDessert,
  })
  typeOfRestaurant?: string;

  @property({
    type: 'object',
    required: true,
  })
  businessHours?: BusinessHoursObject;

  @property({
    type: 'array',
    itemType: 'object',
  })
  menu?: MediaContents[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  view?: MediaContents[];
}

@model()
export class GeneralInfomation {
  @property({
    type: 'object',
  })
  stay?: StayGeneralInformation;
  food?: FoodGeneralInformation;
}

@model()
export class Page extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [PageTypesEnum.food, PageTypesEnum.stay, PageTypesEnum.tour],
    },
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  phone: string;

  @property({
    type: 'boolean',
    required: true,
    default: true,
  })
  isActive: boolean;

  @property({
    type: 'string',
  })
  bio?: string;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  isOfficial: boolean;

  @property({
    type: 'string',
  })
  businessType?: string;

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

  @property({
    type: 'object',
  })
  backgroundMedia?: MediaContents;

  @property({
    type: 'object',
  })
  avatarMedia?: MediaContents;

  @property({
    type: 'object',
  })
  generalInformation?: GeneralInfomation;

  @property({
    type: 'number',
  })
  notificationsCountNew?: number;

  @property({
    type: 'number',
  })
  conversationCountUnread?: number;

  @belongsTo(() => Locations) locationId: number;
  @belongsTo(() => Users) userId: number;
  @belongsTo(() => Users) relatedUserId: number;
  @belongsTo(() => MediaContents) avatarId: number;
  @belongsTo(() => MediaContents) backgroundId: number;
  @belongsTo(() => PropertyType) stayPropertytypeId: number;
  @belongsTo(() => Currency) currencyId: number;

  @hasOne(() => PageVerification) pageVerification: PageVerification;
  @hasMany(() => AccommodationType, {keyTo: 'pageId'})
  shares: AccommodationType[];
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [prop: string]: any;

  constructor(data?: Partial<Page>) {
    super(data);
  }
}

export interface PageRelations {
  // describe navigational properties here
  location: Locations;
  user: Users;
  avatar: MediaContents;
  background: MediaContents;
  relatedUser: Users;
}

export type PageWithRelations = Page & PageRelations;
