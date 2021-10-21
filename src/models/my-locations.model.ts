import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {Locations} from './locations.model';
import {Users} from './users.model';
import {
  MY_MAP_TARGET_TYPES,
  MY_MAP_TYPES,
  MYMAP_ACCESS_TYPE,
  MYMAP_ACCESS_TYPE_PUBLIC,
} from '../configs/mymap-constants';

@model()
export class MyLocations extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    jsonSchema: {
      enum: MY_MAP_TYPES(),
    },
  })
  myMapType?: string;

  @property({
    type: 'number',
  })
  representativePostId?: number;

  @property({
    type: 'string',
    jsonSchema: {
      enum: MYMAP_ACCESS_TYPE,
    },
    default: MYMAP_ACCESS_TYPE_PUBLIC,
  })
  accessType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: MY_MAP_TARGET_TYPES(),
    },
  })
  targetType?: string;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  createdAt?: string;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  updatedAt?: string;

  @belongsTo(() => Locations)
  locationId: number;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<MyLocations>) {
    super(data);
  }
}

export interface MyLocationsRelations {
  location: Locations;
  // describe navigational properties here
}

export type MyLocationsWithRelations = MyLocations & MyLocationsRelations;
