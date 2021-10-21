import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {MediaContents} from './media-contents.model';
import {Profiles} from './profiles.model';

@model()
export class Backgrounds extends Entity {
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

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  updatedAt?: string;

  @belongsTo(() => MediaContents)
  mediaContentId: number;

  @belongsTo(() => Profiles)
  profileId: number;

  constructor(data?: Partial<Backgrounds>) {
    super(data);
  }
}

export interface BackgroundsRelations {
  // describe navigational properties here
}

export type BackgroundsWithRelations = Backgrounds & BackgroundsRelations;
