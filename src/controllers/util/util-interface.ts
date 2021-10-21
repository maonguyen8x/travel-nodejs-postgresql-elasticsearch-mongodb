import {
  ActivityWithRelations,
  Currency,
  DestinationObject,
  Interesting,
  Locations,
  LocationsWithRelations,
  MediaContents,
  PageWithRelations,
  PostsWithRelations,
  ServiceWithRelations,
  StayWithRelations,
  Page,
  Service,
  TotalTourTimeObject,
  TimeToOrganizeTour,
  CustormStringObject,
  FoodGeneralInformation,
} from '../../models';

export interface HomeSearchInterface {
  q?: string;
  coordinates?: string;
  offset?: number;
  limit?: number;
  distance?: number;
  where?: object;
  order?: string[];
}

export interface HomeResultDataInterface extends Partial<Locations> {
  attachments?: {
    mediaContents?: (MediaContents | undefined)[];
  };
  pageId?: number;
  tourId?: number;
  totalRanking?: number;
  hadInteresting?: boolean;
  interesting?: Interesting | null;
  isSavedLocation?: boolean;
  pageFoodGeneralInformation?: FoodGeneralInformation;
  pageFoodPrice?: {
    minPrice: PriceCurrencyInterface;
    maxPrice: PriceCurrencyInterface;
  };
  pageFoodReview?: {
    totalReview?: number;
    averagePoint?: number;
  };
}

export interface HomeResultDataTourInterface extends Omit<HomeResultDataInterface, 'tour'> {
  tour?: {
    id?: number;
    currency?: Currency;
    currencyId?: number;
    tourName?: string;
    price?: number;
    destinations?: DestinationObject[];
    totalTourTime?: TotalTourTimeObject;
    timeToOrganizeTour?: TimeToOrganizeTour[];
    isDailyTour?: boolean;
    dateOff?: CustormStringObject[];
  };
  serviceId?: number;
}

export interface LocationActivityInterface extends Partial<LocationsWithRelations> {
  activity?: ActivityWithRelations;
  post?: PostsWithRelations | null;
  attachments?: {
    mediaContents?: MediaContents[];
  };
}

export interface LocationStayInterface extends Partial<LocationsWithRelations> {
  service?: Partial<ServiceWithRelations> | null;
  serviceId: typeof Service.prototype.id;
  stay?: StayWithRelations;
  post?: PostsWithRelations | null;
  hadInteresting?: boolean;
  isSavedLocation?: boolean;
  attachments?: {
    mediaContents?: MediaContents[];
  };
  page: PageWithRelations;
  pageId: typeof Page.prototype.id;
}

export interface PriceCurrencyInterface {
  value: number;
  currency?: Currency;
}
