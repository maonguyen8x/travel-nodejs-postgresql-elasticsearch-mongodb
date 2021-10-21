import {Entity, hasMany, model, property} from '@loopback/repository';
import moment from 'moment';
import {Message} from './message.model';

@model()
export class ParticipantsObject {
  @property({
    type: 'number',
  })
  userId: number;
}

@model()
export class AccessReadObject {
  @property({
    type: 'number',
  })
  userId: number;
}

@model()
export class AccessWriteObject {
  @property({
    type: 'number',
  })
  userId: number;
}

@model()
export class ContributorObject {
  @property({
    type: 'number',
  })
  userId: number;
}

@model()
export class Conversation extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
  })
  conversationKey?: string;

  @property({
    type: 'string',
  })
  conversationType?: string;

  @property({
    type: 'string',
  })
  conversationName?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  participants: ParticipantsObject[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  accessRead: AccessReadObject[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  accessWrite: AccessWriteObject[];

  @property({
    type: 'object',
  })
  readAt?: object;

  @property({
    type: 'object',
  })
  notify?: object;

  @property({
    type: 'array',
    itemType: 'object',
  })
  deletedConversations?: object[];

  @property({
    type: 'array',
    itemType: 'number',
  })
  adminList?: number[];

  @property({
    type: 'array',
    itemType: 'object',
  })
  contributors?: ContributorObject[];

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

  @hasMany(() => Message)
  messages: Message[];

  constructor(data?: Partial<Conversation>) {
    super(data);
  }
}

export interface ConversationRelations {
  // describe navigational properties here
}

export type ConversationWithRelations = Conversation & ConversationRelations;
