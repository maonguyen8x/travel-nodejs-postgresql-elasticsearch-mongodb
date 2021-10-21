import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Users} from './users.model';
import {Locations, LocationsWithRelations} from './locations.model';

@model()
export class BookmarkLocation extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  status?: string;

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
  deletedAt?: string;

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Locations)
  locationId: number;

  constructor(data?: Partial<BookmarkLocation>) {
    super(data);
  }
}

export interface BookmarkLocationRelations {
  // describe navigational properties here
  location: LocationsWithRelations;
}

export type BookmarkLocationWithRelations = BookmarkLocation & BookmarkLocationRelations;
