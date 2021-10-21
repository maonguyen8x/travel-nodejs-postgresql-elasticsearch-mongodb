import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {Locations} from './locations.model';
import {Users} from './users.model';

@model()
export class Interesting extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  createdAt?: string;

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Locations)
  locationId: number;

  constructor(data?: Partial<Interesting>) {
    super(data);
  }
}

export interface InterestingRelations {
  // describe navigational properties here
  location: Locations;
}

export type InterestingWithRelations = Interesting & InterestingRelations;
