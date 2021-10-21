import {Entity, model, property, belongsTo, hasMany} from '@loopback/repository';
import {Users} from './users.model';
import {Task} from './task.model';
import moment from 'moment';
import {PlanAccessTypeEnum, PlanStatusEnum} from '../controllers/plan/plan.constant';

@model()
export class Plan extends Entity {
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
  planName: string;

  @property({
    type: 'date',
  })
  startDate?: string;

  @property({
    type: 'date',
  })
  endDate?: string;

  @property({
    type: 'string',
  })
  note?: string;

  @property({
    type: 'string',
    default: PlanAccessTypeEnum.public,
    jsonSchema: {
      enum: [PlanAccessTypeEnum.public, PlanAccessTypeEnum.follow, PlanAccessTypeEnum.private],
    },
  })
  accessType?: string;

  @property({
    type: 'string',
    default: PlanStatusEnum.draft,
    jsonSchema: {
      enum: [PlanStatusEnum.draft, PlanStatusEnum.completed],
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

  @belongsTo(() => Users)
  userId: number;

  @hasMany(() => Task)
  tasks: Task[];
  // Define well-known properties here

  constructor(data?: Partial<Plan>) {
    super(data);
  }
}

export interface PlanRelations {
  // describe navigational properties here
}

export type PlanWithRelations = Plan & PlanRelations;
