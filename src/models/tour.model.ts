import {belongsTo, Entity, model, property, hasMany} from '@loopback/repository';
import {Locations} from './locations.model';
import {Service, ServiceWithRelations} from './service.model';
import {TimeToOrganizeTour} from './time-to-organize-tour.model';
import {ServiceIncludeCodes, VehicleIncludeCodes} from '../controllers/services/service.constant';

export class Media {
  @property({
    type: 'string',
  })
  url: string;

  @property({
    type: 'string',
  })
  urlBlur: string;

  @property({
    type: 'string',
  })
  urlTiny: string;

  @property({
    type: 'string',
  })
  urlOptimize: string;

  @property({
    type: 'string',
  })
  metadata: string;

  @property({
    type: 'string',
  })
  publicId: string;

  @property({
    type: 'string',
  })
  format: string;

  @property({
    type: 'string',
  })
  mediaType: string;

  @property({
    type: 'string',
  })
  resourceType: string;

  @property({
    type: 'string',
  })
  fileName: string;

  @property({
    type: 'string',
  })
  path: string;
}

export class ProgramTour {
  @property({
    type: 'string',
  })
  timeTitle: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  scheduleDay: ScheduleDay[];
}

export class ScheduleDay {
  @property({
    type: 'string',
  })
  timeTitle: string;

  @property({
    type: 'string',
  })
  description: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  mediaContents: Media[];
}

export class PickupDropoffLocation {
  @property({
    type: 'boolean',
  })
  custormerLocationChoose: boolean;

  //
  @property({
    type: 'boolean',
  })
  accordingToTheRulesOfTheTour: boolean;

  @property({
    type: 'string',
  })
  pickupPoint: string;

  @property({
    type: 'string',
  })
  dropoffPoint: string;
}

export class DestinationObject {
  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
    default: '',
  })
  formatedAddress: string;
}

export class DepartureLocationObject {
  @property({
    type: 'string',
  })
  text: string;

  @property({
    type: 'object',
  })
  location: Locations;
}

export class TotalTourTimeObject {
  @property({
    type: 'number',
  })
  day?: number;

  @property({
    type: 'number',
  })
  night?: number;
}

export class CustormStringObject {
  @property({
    type: 'date',
  })
  value: string;
}
export class VehicleServicesObject {
  @property({
    type: 'string',
    jsonSchema: {
      enum: VehicleIncludeCodes,
    },
  })
  value: string;
}

export class IncludeServicesObject {
  @property({
    type: 'string',
    jsonSchema: {
      enum: ServiceIncludeCodes,
    },
  })
  value: string;
}
export class CancellationPolicyObject {
  @property({
    type: 'string',
  })
  text: string;

  @property({
    type: 'boolean',
    default: true,
  })
  freeCancellation: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  conditionalCancellation: boolean;
}

@model()
export class Tour extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  destinations?: DestinationObject[];

  @property({
    type: 'object',
  })
  pickupDropoffLocation?: PickupDropoffLocation;

  @property({
    type: 'number',
    required: true,
  })
  normalAdultPrice?: number;

  @property({
    type: 'number',
    default: 0,
  })
  normalChildPrice?: number;

  @property({
    type: 'number',
    required: true,
  })
  holidayAdultPrice?: number;

  @property({
    type: 'number',
    default: 0,
  })
  holidayChildPrice?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  holidays?: CustormStringObject[];

  @property({
    type: 'boolean',
    required: true,
  })
  isDailyTour?: boolean;

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  vehicleServices?: VehicleServicesObject[];

  @property({
    type: 'object',
    required: true,
  })
  departureLocation?: DepartureLocationObject;

  @property({
    type: 'string',
  })
  descriptions?: string;

  @property({
    type: 'number',
  })
  maxPassenger?: number;

  @property({
    type: 'object',
    required: true,
  })
  cancellationPolicy?: CancellationPolicyObject;

  @property({
    type: 'string',
  })
  surchargePolicy?: string;

  @property({
    type: 'string',
  })
  note?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  programs?: ProgramTour[];

  @property({
    type: 'object',
    required: true,
  })
  totalTourTime?: TotalTourTimeObject;

  @property({
    type: 'array',
    itemType: 'object',
    required: true,
  })
  includeServices?: IncludeServicesObject[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  dateOff?: CustormStringObject[];

  @property({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

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

  @belongsTo(() => Service) serviceId?: number;

  @belongsTo(() => Locations)
  locationId: number;

  @hasMany(() => TimeToOrganizeTour)
  timeToOrganizeTours: TimeToOrganizeTour[];
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  constructor(data?: Partial<Tour>) {
    super(data);
  }
}

export interface TourRelations {
  // describe navigational properties here
  location: Locations;
  timeToOrganizeTours: TimeToOrganizeTour[];
  service: ServiceWithRelations;
}

export type TourWithRelations = Tour & TourRelations;
