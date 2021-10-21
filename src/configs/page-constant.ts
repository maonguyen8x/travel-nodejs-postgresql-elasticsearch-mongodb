import {LocationTypesEnum} from './location-constant';

export enum PageTypesEnum {
  food = LocationTypesEnum.food,
  stay = LocationTypesEnum.stay,
  tour = LocationTypesEnum.tour,
}

export const ServiceTypes = [LocationTypesEnum.food, LocationTypesEnum.stay, LocationTypesEnum.tour];
