import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Users} from './users.model';
import moment from 'moment';
import {LANGUAGES} from '../configs/utils-constant';

@model()
export class DeviceToken extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
  })
  deviceToken?: string;

  @property({
    type: 'string',
  })
  macAddress?: string;

  @property({
    type: 'string',
  })
  ipAddress?: string;

  @property({
    type: 'string',
  })
  brand?: string;

  @property({
    type: 'string',
  })
  model?: string;

  @property({
    type: 'string',
  })
  systemVersion?: string;

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
    type: 'string',
    default: LANGUAGES.EN,
    jsonSchema: {
      enum: [LANGUAGES.EN, LANGUAGES.VI],
    },
  })
  language?: string;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<DeviceToken>) {
    super(data);
  }
}

export interface DeviceTokenRelations {
  // describe navigational properties here
}

export type DeviceTokenWithRelations = DeviceToken & DeviceTokenRelations;
