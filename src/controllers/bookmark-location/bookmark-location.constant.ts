import {BookmarkLocation, LocationRequests, Rankings} from '../../models';
import {HandleSearchResultInterface} from '../locations/location-interface';

export enum BookmarkLocationStatusEnums {
  unpublished = 'UNPUBLISHED',
  published = 'PUBLISHED',
}

export interface BookmarkLocationWithLocationHadAttachmentInterface extends Partial<BookmarkLocation> {
  location?: HandleSearchResultWithLocationRequestInterface | null;
  ranking?: Rankings | null;
}

export interface HandleSearchResultWithLocationRequestInterface extends HandleSearchResultInterface {
  locationRequest?: LocationRequests | null;
}
