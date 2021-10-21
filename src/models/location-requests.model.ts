import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Locations} from './locations.model';
import {Users} from './users.model';
import {locationTypes, locationStatus} from '../configs/location-constant';

@model()
export class LocationRequests extends Entity {
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
  coordinates?: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  name?: string;

  @property({
    type: 'string',
    required: true,
  })
  formatedAddress?: string;

  @property({
    type: 'string',
    required: true,
  })
  address?: string;

  @property({
    type: 'string',
  })
  country?: string;

  @property({
    type: 'string',
  })
  areaLevel1?: string;

  @property({
    type: 'string',
  })
  areaLevel2?: string;

  @property({
    type: 'string',
  })
  areaLevel3?: string;

  @property({
    type: 'string',
  })
  areaLevel4?: string;

  @property({
    type: 'string',
  })
  areaLevel5?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: locationTypes,
    },
  })
  locationType?: string;

  @property({
    type: 'string',
  })
  refusingReason?: string;

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
    type: 'string',
    required: true,
    jsonSchema: {
      enum: locationStatus,
    },
  })
  status: string;

  @belongsTo(() => Users, {name: 'creator'})
  userId: number;

  @belongsTo(() => Locations, {name: 'location'})
  locationId: number;

  constructor(data?: Partial<LocationRequests>) {
    super(data);
  }
}

export interface LocationRequestsRelations {
  // describe navigational properties here
  location: Locations;
  creator: Users;
}

export type LocationRequestsWithRelations = LocationRequests & LocationRequestsRelations;
