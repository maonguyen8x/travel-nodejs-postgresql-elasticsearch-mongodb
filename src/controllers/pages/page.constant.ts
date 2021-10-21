import {getModelSchemaRef, ReferenceObject, SchemaObject} from '@loopback/rest';
import {
  AccommodationType,
  Locations,
  MediaContents,
  Page,
  PropertyType,
  StayGeneralInformation,
  FoodGeneralInformation,
} from '../../models';

export enum VerifyPageStatus {
  REQUESTED = 'REQUESTED',
  COMPLETED = 'COMPLETED',
  REJECT = 'REJECT',
}

export enum EnumIdentityType {
  IDENTITY_CARD = 'IDENTITY_CARD',
  PASSPORT = 'PASSPORT',
  LICENSE = 'LICENSE',
}

export enum PageBookingTypeEnum {
  quickBooking = 'QUICK_BOOKING',
  confirmBooking = 'CONFIRM_BOOKING',
}

export enum PageRentalTypeEnum {
  fullHouse = 'FULL_HOUSE',
  privateRoom = 'PRIVATE_ROOM',
  shareRoom = 'SHARE_ROOM',
}

export enum PageCancellationPolicyEnum {
  average = 'AVERAGE',
  flexible = 'FLEXIBLE',
  strict = 'STRICT',
}

export enum PageCheckinMethodEnum {
  selfCheckin = 'SELF_CHECKIN',
  contactHost = 'CONTACT_HOST',
  reception = 'RECEPTION',
}

export enum PageBusinessTypeEnum {
  PERSONAL = 'PERSONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TypeOfRestaurantEnum {
  coffeeDessert = 'COFFEE_DESSERT',
  restaurant = 'RESTAURANT',
  setMenuService = 'SET_MENU_SERVICE',
  aLacarte = 'A_LACARTE',
  buffet = 'BUFFET',
  banquetHall = 'BANQUET_HALL',
  weddingRestaurant = 'WEDDING_RESTAURANT',
  fastFood = 'FAST_FOOD',
  snacks = 'SNACKS',
  takeAway = 'TAKE_AWAY',
  barBeerClub = 'BAR_BEER_CLUB',
  other = 'OTHER',
}

export interface UpdateStayGeneralInfomationInterface {
  currencyId: number;
  stayPropertytypeId: number;
  generalInformation: {
    stay: StayGeneralInformationWithAccommodationTypesInterface;
  };
}

export interface UpdateFoodGeneralInfomationInterface {
  generalInformation: {
    food: FoodGeneralInformation;
  };
}

export interface StayGeneralInformationWithAccommodationTypesInterface extends Partial<StayGeneralInformation> {
  accommodationTypes: AccommodationType[];
}

export const schemaDetailPage = (title: string): ReferenceObject | SchemaObject => {
  return {
    title: `${title}`,
    type: 'object',
    properties: {
      ...getModelSchemaRef(Page, {
        title: `PageDetail`,
        exclude: ['generalInformation'],
      }).definitions[`PageDetail`].properties,
      generalInformation: {
        title: `GeneralInformation`,
        type: 'object',
        properties: {
          stay: {
            title: 'StayGeneralInformation',
            type: 'object',
            properties: {
              ...getModelSchemaRef(StayGeneralInformation, {
                title: 'StayGeneralInformation',
              }).definitions['StayGeneralInformation'].properties,
              accommodationTypes: {
                type: 'array',
                items: getModelSchemaRef(AccommodationType),
              },
            },
          },
        },
      },
      background: getModelSchemaRef(MediaContents),
      avatar: getModelSchemaRef(MediaContents),
      stayPropertytype: getModelSchemaRef(PropertyType),
      location: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          isSavedLocation: {
            type: 'boolean',
          },
        },
      },
    },
  };
};
