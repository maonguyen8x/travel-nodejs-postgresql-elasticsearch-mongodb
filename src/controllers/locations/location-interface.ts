import {Where} from '@loopback/repository';

import {
  Currency,
  DestinationObject,
  Interesting,
  Locations,
  MediaContents,
  Rankings,
  TotalTourTimeObject,
  MaterializedViewLocations,
  Activity,
  Tour,
  FoodGeneralInformation,
} from '../../models';

export interface HandleSearchResultInterface extends Partial<Omit<Locations, 'tour'>> {
  attachments?: {
    mediaContents?: MediaContents[];
  };
  key?: number;
  distance?: number;
  pageId?: number;
  serviceId?: number;
  ranking?: Rankings | null;
  totalPosts?: number;
  hadInteresting?: boolean;
  interesting?: Interesting | null;
  isSavedLocation?: boolean;
  savedToBookmark?: boolean;
  locationId?: number;
  pageFoodGeneralInformation?: FoodGeneralInformation | null;
  pageFoodReview?: {
    totalReview?: number;
    averagePoint?: number;
  };
  pageFoodPrice?: {
    minPrice?: PriceCurrencyInterface;
    maxPrice?: PriceCurrencyInterface;
  };
  tour?: {
    id?: number;
    currency?: Currency;
    currencyId?: number;
    tourName?: string;
    price?: number;
    destinations?: DestinationObject[];
    totalTourTime?: TotalTourTimeObject;
    totalRanking?: number;
    vehicleServices?: string[];
  };
}

export interface PriceCurrencyInterface {
  value: number;
  currency?: Currency;
}

export interface SearchResultInterface extends Locations {
  distance?: number;
  attachments?: {
    mediaContents?: MediaContents[];
  };
}

export interface ILocationSearchInput {
  q: string;
  coordinates: string;
  offset: number;
  limit: number;
  distance: number;
  skip: number;
  where: Where<Locations>;
  isFull: boolean;
  order: string[];
  filterActivity?: IActivitySearchInput;
  filterTour?: ITourSearchInput;
  searchType?: string;
}
export interface ITourSearchInput {
  where: Where<Tour>;
  startDay: string;
}
export interface ITourOfLocation {
  id?: number;
  currency?: Partial<Currency>;
  currencyId?: number;
  name?: string;
  price?: number;
  destinations?: DestinationObject[];
  totalTourTime?: TotalTourTimeObject;
  vehicleServices?: string[];
}
export interface IActivitySearchInput {
  where: Where<Activity>;
  dateSearch: string;
}
export interface ILocationResponse extends Partial<MaterializedViewLocations> {
  attachments: {
    mediaContents?: MediaContents[];
  };
  pageId?: number;
  hadInteresting: boolean;
  tour?: ITourOfLocation;
  serviceId?: number;
}
