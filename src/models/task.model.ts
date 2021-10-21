import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Plan} from './plan.model';
import {Locations, LocationsWithRelations} from './locations.model';
import moment from 'moment';
import {TASK_STATUS, TASK_STATUS_INCOMPLETE, TASK_TYPES} from '../configs/plan-constant';
import {MediaContents} from './media-contents.model';

@model()
export class Task extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: TASK_TYPES,
    },
  })
  taskType: string;

  @property({
    type: 'number',
  })
  index: number;

  @property({
    type: 'string',
  })
  taskDate?: string;

  @property({
    type: 'string',
    default: TASK_STATUS_INCOMPLETE,
    jsonSchema: {
      enum: TASK_STATUS,
    },
  })
  status?: string;

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

  @belongsTo(() => Plan)
  planId: number;

  @belongsTo(() => Locations)
  locationId: number;

  constructor(data?: Partial<Task>) {
    super(data);
  }
}

export interface TaskRelations {
  // describe navigational properties here
  location?: Partial<LocationsWithRelations>;
  mediaContents?: MediaContents[];
}

export type TaskWithRelations = Task & TaskRelations;
