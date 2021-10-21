import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {MediaContents, MediaContentsWithRelations} from './media-contents.model';
import {Profiles} from './profiles.model';

@model()
export class Avatars extends Entity {
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

  @belongsTo(() => Profiles)
  profileId: number;

  @belongsTo(() => MediaContents)
  mediaContentId: number;

  constructor(data?: Partial<Avatars>) {
    super(data);
  }
}

export interface AvatarsRelations {
  // describe navigational properties here
  mediaContent: MediaContentsWithRelations;
}

export type AvatarsWithRelations = Avatars & AvatarsRelations;
