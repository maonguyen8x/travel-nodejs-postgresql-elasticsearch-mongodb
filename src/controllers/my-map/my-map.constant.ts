import {LocationRequests, MyLocations, Rankings} from '../../models';
import {HandleSearchResultInterface} from '../locations/location-interface';

export interface MyMapWithLocationHadAttachmentInterface extends MyLocations {
  location?: HandleSearchResultWithLocationRequestInterface | null;
  ranking?: Rankings | null;
}

export interface HandleSearchResultWithLocationRequestInterface extends HandleSearchResultInterface {
  locationRequest?: LocationRequests | null;
}
