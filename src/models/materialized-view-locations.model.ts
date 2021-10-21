import {Entity, model, property} from '@loopback/repository';
import {MediaContents} from './media-contents.model';
import {DestinationObject, TotalTourTimeObject, VehicleServicesObject} from './tour.model';

@model()
export class MaterializedViewLocations extends Entity {
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
  status: string;

  @property({
    type: 'string',
  })
  locationType?: string;

  @property({
    type: 'number',
  })
  totalReview?: number;

  @property({
    type: 'number',
  })
  averagePoint?: number;

  @property({
    type: 'object',
  })
  backgroundMedia?: MediaContents;

  @property({
    type: 'object',
  })
  avatarMedia?: MediaContents;

  @property({
    type: 'array',
    itemType: 'object',
  })
  postMedias?: MediaContents[];

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'number',
  })
  tourId?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  tourMedias?: MediaContents[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  tourDestinations?: DestinationObject[];

  @property({
    type: 'object',
  })
  totalTourTime?: TotalTourTimeObject;

  @property({
    type: 'array',
    itemType: 'object',
  })
  tourVehicleServices?: VehicleServicesObject[];

  @property({
    type: 'string',
  })
  tourName?: string;

  @property({
    type: 'number',
  })
  tourPrice?: number;

  @property({
    type: 'number',
  })
  tourCurrencyId?: number;

  @property({
    type: 'string',
  })
  tourCurrencyCode?: string;

  @property({
    type: 'string',
  })
  tourCurrencySymbol?: string;

  @property({
    type: 'string',
  })
  tourCurrencyText?: string;

  @property({
    type: 'number',
  })
  pageId?: number;

  @property({
    type: 'number',
  })
  tourServiceId?: number;

  constructor(data?: Partial<MaterializedViewLocations>) {
    super(data);
  }
}

export interface MaterializedViewLocationsRelations {
  // describe navigational properties here
}

export type MaterializedViewLocationsWithRelations = MaterializedViewLocations & MaterializedViewLocationsRelations;
