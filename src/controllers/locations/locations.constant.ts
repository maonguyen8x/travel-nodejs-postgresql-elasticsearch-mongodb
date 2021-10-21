import {RequestBodyObject} from '@loopback/rest';

export const LOCATION_CHANGE_REQUEST_BODY: RequestBodyObject = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          coordinates: {
            type: 'string',
          },
          address: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          country: {
            type: 'string',
          },
          areaLevel1: {
            type: 'string',
          },
          areaLevel2: {
            type: 'string',
          },
          areaLevel3: {
            type: 'string',
          },
          areaLevel4: {
            type: 'string',
          },
          areaLevel5: {
            type: 'string',
          },
          formatedAddress: {
            type: 'string',
          },
          locationType: {
            type: 'string',
          },
        },
        required: [
          'coordinates',
          'name',
          'country',
          'areaLevel1',
          'areaLevel2',
          'areaLevel3',
          'formatedAddress',
          'locationType',
        ],
      },
    },
  },
};

export interface ILocationChangeRequest {
  coordinates: string;
  name: string;
  address?: string;
  country: string;
  areaLevel1: string;
  areaLevel2: string;
  areaLevel3: string;
  areaLevel4?: string;
  areaLevel5?: string;
  formatedAddress: string;
  locationType: string;
  status?: string;
  userId?: number;
  locationId?: number;
}

export enum LocationChangeRequestStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export const SEARCH_TYPE_NEARBY_LOCATION = 'NEARBY';
export const SEARCH_TYPE_ACTIVITY_LOCATION = 'ACTIVITY';
export const SEARCH_TYPE_ALL_LOCATION = 'ALL';

export const LOCATION_OPTIONS = {
  fields: {
    id: true,
    coordinates: true,
    latitude: true,
    longitude: true,
    name: true,
    formatedAddress: true,
    address: true,
    country: true,
    areaLevel1: true,
    areaLevel2: true,
    areaLevel3: true,
    areaLevel4: true,
    areaLevel5: true,
    locationType: true,
    totalReview: true,
    averagePoint: true,
  },
  select: [
    'id',
    'coordinates',
    'latitude',
    'longitude',
    'name',
    'formatedAddress',
    'address',
    'country',
    'areaLevel1',
    'areaLevel2',
    'areaLevel3',
    'areaLevel4',
    'areaLevel5',
    'locationType',
    'totalReview',
    'averagePoint',
  ],
};
