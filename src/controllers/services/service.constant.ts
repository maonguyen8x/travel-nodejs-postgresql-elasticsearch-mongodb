import {getModelSchemaRef, ReferenceObject, SchemaObject} from '@loopback/rest';
import * as Joi from 'joi';
import {ServiceStatusEnum} from '../../configs/service-constant';
import {
  Posts,
  MediaContents,
  PostsRelations,
  Currency,
  Tour,
  Locations,
  ProgramTour,
  TimeToOrganizeTour,
  ServiceRelations,
  Service,
  Page,
  StayWithRelations,
  PageWithRelations,
  Rankings,
  PostsWithRelations,
  Stay,
  StayRules,
  AccommodationType,
  LocationsWithRelations,
  StaySpecialDayPrice,
  StayOffDay,
} from '../../models';
import {schemaDetailPage} from '../pages/page.constant';

export interface ServiceBodyPostRequest extends Posts {
  mediaContents: MediaContents[];
  name: string;
  price: number;
  currencyId: number;
  flag: number;
  status?: string;
}

export interface ResponseServiceFoodDetailInterface extends Posts, PostsRelations {
  name?: string;
  price?: number;
  currency?: Currency;
  liked: boolean;
  marked: boolean;
  rated: boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface ServiceTourBodyTourRequest extends Tour {
  location?: DepatureLocationsInterface;
  programs?: ProgramTour[];
  currencyId?: number;
  flag: number;
  name: string;
  pageId: number;
  mediaContents?: MediaContents[];
  timeToOrganizeTour?: Partial<TimeToOrganizeTour>[];
  dateOff?: string[];
  holidays?: string[];
  vehicleServices?: string[];
  includeServices?: string[];
}
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface ServiceTourResponse extends Tour {
  dateOff?: string[];
  holidays?: string[];
  vehicleServices: string[];
  includeServices: string[];
}

export interface DepatureLocationsInterface extends Partial<Locations> {
  text: string;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface TourDetailInterface extends Tour {
  location?: Locations;
  service: Service & ServiceRelations;
  currency: Currency;
  name?: string;
  page: Page;
  flag: number;
  isSavedLocation: boolean;
  mediaContents: MediaContents[];
  dateOff?: string[];
  holidays?: string[];
  vehicleServices: string[];
  includeServices: string[];
}

export const ServiceIncludeCodes = ['ICINSURRANCE', 'ICTOURGUIDE', 'ICDRINK', 'ICFOOD', 'ICTICKET', 'ICVEHICLE'];

export const VehicleIncludeCodes = ['ICBIKE', 'ICCAR', 'ICPLANES', 'ICMOTORCYCLE', 'ICTRAIN', 'ICSHIP'];

export interface ServiceStayBodyRequest extends Partial<Service> {
  location?: Locations;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface ServiceStayResponseInterface extends Service {
  location?: Locations;
  description?: string;
  isSavedLocation?: boolean;
  stay?: StayWithRelations;
  liked?: boolean;
  marked?: boolean;
  rated?: boolean;
  averagePoint?: number;
  totalRanking?: number;
  ranking?: Rankings | null;
  page?: PageWithRelations;
  post?: Partial<PostsWithRelations> | null;
}

export const schemaRequestBodyStay = (title: string): ReferenceObject | SchemaObject => {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Stay, {
        title: `${title}Stay`,
        exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'serviceId', 'rules'],
      }).definitions[`${title}Stay`].properties,
      rules: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(StayRules, {title: `${title}StayRules`}).definitions[`${title}StayRules`].properties,
        },
      },
      status: {
        type: 'string',
        enum: [ServiceStatusEnum.draft, ServiceStatusEnum.public],
      },
      pageId: {
        type: 'number',
      },
      currencyId: {
        type: 'number',
      },
    },
    required: ['status', 'pageId', 'currencyId'],
  };
};

export const schemaResponseStayDetail = (title: string): ReferenceObject | SchemaObject => {
  return {
    title: `${title}`,
    type: 'object',
    properties: {
      ...getModelSchemaRef(Stay, {
        title: `StayDetail`,
        exclude: ['rules'],
      }).definitions.StayDetail.properties,
      rules: getModelSchemaRef(StayRules),
      mediaContents: {
        type: 'array',
        items: getModelSchemaRef(MediaContents),
      },
      page: schemaDetailPage(`${title}Page`),
      offDays: {
        type: 'array',
        items: getModelSchemaRef(StayOffDay),
      },
      post: {
        title: `${title}Post`,
        type: 'object',
        properties: {
          ...getModelSchemaRef(Posts, {title: 'PostDetail'}).definitions.PostDetail.properties,
          rated: {
            type: 'boolean',
          },
          rankings: {
            type: 'array',
            items: getModelSchemaRef(Rankings),
          },
          liked: {
            type: 'boolean',
          },
        },
      },
      currency: getModelSchemaRef(Currency),
      accommodationType: getModelSchemaRef(AccommodationType),
      specialDayPrices: {
        type: 'array',
        items: getModelSchemaRef(StaySpecialDayPrice),
      },
    },
  };
};

export const schemaStayInput = Joi.object({
  name: Joi.string().required(),
  introduction: Joi.string().required(),
  acreage: Joi.string().required(),
  bio: Joi.string(),
  numberOfBedroom: Joi.number().min(0).integer().required(),
  numberOfBed: Joi.number().min(0).integer().required(),
  numberOfSingleBed: Joi.number().min(0).integer().required(),
  numberOfDoubleBed: Joi.number().min(0).integer().required(),
  numberOfLargeDoubleBed: Joi.number().min(0).integer().required(),
  numberOfLargeBed: Joi.number().min(0).integer().required(),
  numberOfSuperLargeBed: Joi.number().min(0).integer().required(),
  numberOfMattress: Joi.number().min(0).integer().required(),
  numberOfSofa: Joi.number().min(0).integer().required(),
  numberOfBunk: Joi.number().min(0).integer().required(),
  numberOfBathroom: Joi.number().min(0).integer().required(),
  numberOfPrivateBathroom: Joi.number().min(0).integer().required(),
  numberOfSharedBathroom: Joi.number().min(0).integer().required(),
  numberOfKitchen: Joi.number().min(0).integer().required(),
  numberOfPrivateKitchen: Joi.number().min(0).integer().required(),
  numberOfSharedKitchen: Joi.number().min(0).integer().required(),
  amenities: Joi.array().items(Joi.string()).required(),
  facilities: Joi.array().items(Joi.string()).required(),
  rules: Joi.object({
    smoking: Joi.string().required(),
    pet: Joi.string().required(),
    party: Joi.string().required(),
    cooking: Joi.string().required(),
    commercialPhoto: Joi.string().required(),
    agreeRules: Joi.boolean().required(),
    depositRequired: Joi.boolean().required(),
    avoidMakingNoises: Joi.boolean().required(),
    noShoesInHouse: Joi.boolean().required(),
    noSmokingInSharedSpaces: Joi.boolean().required(),
    otherRules: Joi.string().optional().allow(''),
  }),
  mediaContentIds: Joi.array().items(Joi.number().min(1).required()).required(),
  numberOfStandardGuest: Joi.number().min(1).integer().required(),
  maxNumberOfGuest: Joi.number().min(1).integer().required(),
  numberOfAdult: Joi.number().min(1).integer().required(),
  numberOfChild: Joi.number().min(0).integer().required(),
  numberOfInfant: Joi.number().min(0).integer().required(),
  maxguestincludechildandinfant: Joi.boolean().default(true).optional(),
  price: Joi.number().min(0).required(),
  priceWeekend: Joi.number().min(0).required(),
  feeIncreaseAdult: Joi.number().min(0).required(),
  feeIncreaseChild: Joi.number().min(0).required(),
  feeIncreaseInfant: Joi.number().min(0).required(),
  feeCleaning: Joi.number().min(0).required(),
  discountWeeklyRental: Joi.number().min(0).max(1).required(),
  discountMonthlyRental: Joi.number().min(0).max(1).required(),
  discountYearlyRental: Joi.number().min(0).max(1).required(),
  discountEarlyBooking: Joi.number().min(0).max(1).required(),
  discountLastHourBooking: Joi.number().min(0).max(1).required(),
  discountEarlyBookingDay: Joi.number().min(0).required(),
  discountLastHourBookingTime: Joi.string().optional(),
  status: Joi.string().required(),
  accommodationTypeId: Joi.number().min(1).required(),
  pageId: Joi.number().min(1).integer().required(),
  currencyId: Joi.number().min(1).integer().required(),
});

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface ServiceDetailResponseInterface extends Partial<StayWithRelations> {
  page?: PageDetailWithLocationInterface;
  post?: PostDetailWithLikedInterface;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface PageDetailWithLocationInterface extends Partial<PageWithRelations> {
  location?: LocationDetailWithIsSavedLocationInterface;
}

export interface LocationDetailWithIsSavedLocationInterface extends Partial<LocationsWithRelations> {
  isSavedLocation?: boolean;
}

export interface PostDetailWithLikedInterface extends Partial<LocationsWithRelations> {
  liked?: boolean;
  rated?: boolean;
}
