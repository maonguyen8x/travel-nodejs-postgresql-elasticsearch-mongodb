import {Entity, model, property} from '@loopback/repository';
import moment from 'moment';

@model()
export class Monitoring extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  zabbixUrl?: string;

  @property({
    type: 'string',
  })
  zabbixId: string;

  @property({
    type: 'string',
  })
  zabbixPassword: string;

  @property({
    type: 'string',
  })
  grafanaUrl?: string;

  @property({
    type: 'string',
  })
  grafanaId: string;

  @property({
    type: 'string',
  })
  grafanaPassword: string;

  @property({
    type: 'string',
  })
  sustainmentUrl: string;

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

  constructor(data?: Partial<Monitoring>) {
    super(data);
  }
}

export interface MonitoringRelations {
  // describe navigational properties here
}

export type IntegrationWithRelations = Monitoring & MonitoringRelations;
