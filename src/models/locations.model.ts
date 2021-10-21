import {belongsTo, Entity, hasMany, model, property, hasOne} from '@loopback/repository';
import moment from 'moment';
import {Posts} from './posts.model';
import {Rankings} from './rankings.model';
import {Users} from './users.model';
import {LocationStatusEnum, locationTypes} from '../configs/location-constant';
import {MyLocations} from './my-locations.model';
import {Interesting} from './interesting.model';
import {Activity} from './activity.model';
import {Page} from './page.model';
import {Tour} from './tour.model';

@model()
export class Locations extends Entity {
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
    type: 'number',
  })
  latitude?: number;

  @property({
    type: 'number',
  })
  longitude?: number;

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
  })
  placeId?: string;

  @property({
    type: 'string',
    required: true,
  })
  formatedAddress?: string;

  @property({
    type: 'string',
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
    jsonSchema: {
      enum: [LocationStatusEnum.draft, LocationStatusEnum.public],
    },
    default: LocationStatusEnum.public,
  })
  status?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isPublished?: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  isDuplicated?: boolean;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: locationTypes,
    },
  })
  locationType?: string;

  @property({
    type: 'number',
    default: 0,
  })
  totalReview?: number;
  //
  // @property({
  //   type: 'number',
  //   default: 0,
  // })
  // point?: number;

  @property({
    type: 'number',
    default: 0,
  })
  score?: number;

  @property({
    type: 'number',
    default: 0,
  })
  averagePoint?: number;

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

  @property({
    type: 'date',
  })
  deletedAt?: string | null;

  @property({
    type: 'date',
  })
  blockedAt?: string | null;

  @property({
    type: 'string',
  })
  blockMessage?: string | null;

  @property({
    type: 'date',
  })
  updatedAveragePointAt?: string;

  @hasMany(() => Posts, {keyTo: 'locationId'})
  posts: Posts[];

  @hasMany(() => Rankings, {keyTo: 'locationId'})
  rankings: Rankings[];

  @belongsTo(() => Users, {name: 'creator'})
  userId: number;

  @hasMany(() => MyLocations, {keyTo: 'locationId'})
  myLocations: MyLocations[];

  @hasMany(() => Interesting, {keyTo: 'locationId'})
  interestings: Interesting[];

  @hasOne(() => Tour, {keyTo: 'locationId'})
  tour: Tour;

  @hasOne(() => Activity, {keyTo: 'locationId'})
  activity: Activity;

  @hasOne(() => Page, {keyTo: 'locationId'})
  page: Page;

  constructor(data?: Partial<Locations>) {
    super(data);
  }
}

export interface LocationsRelations {
  // describe navigational properties here
  creator: Users;
}

export type LocationsWithRelations = Locations & LocationsRelations;
