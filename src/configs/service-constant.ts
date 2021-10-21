import {LocationTypesEnum} from './location-constant';

export enum ServiceTypesEnum {
  food = LocationTypesEnum.food,
  stay = LocationTypesEnum.stay,
  tour = LocationTypesEnum.tour,
}

export const SERVICE_HAS_BOOKING_CANNOT_DELETE = 'SERVICE_HAS_BOOKING_CANNOT_DELETE';

export enum ServiceFlagEnum {
  normal = 0,
  new = 1,
  bestSeller = 2,
}

export enum TourEnum {
  normal = 0,
  new = 1,
  bestSeller = 2,
}

export enum TourTypes {
  normalTour = 'NORMAL_TOUR',
  holidayTour = 'HOLYDAY_TOUR',
}

export enum ServiceStatusEnum {
  draft = 'DRAFT',
  public = 'PUBLIC',
}
