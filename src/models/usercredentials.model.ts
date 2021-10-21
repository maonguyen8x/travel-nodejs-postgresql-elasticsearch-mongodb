import {Entity, model, property} from '@loopback/repository';

@model()
export class Usercredentials extends Entity {
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
  password: string;

  @property({
    type: 'number',
  })
  usersId?: number;

  constructor(data?: Partial<Usercredentials>) {
    super(data);
  }
}

export interface UsercredentialsRelations {
  // describe navigational properties here
}

export type UsercredentialsWithRelations = Usercredentials & UsercredentialsRelations;
