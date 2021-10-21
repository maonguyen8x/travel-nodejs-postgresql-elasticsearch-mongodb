import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Conversation} from './conversation.model';
import {MESSAGE_TYPE} from '../configs/message-constant';
import {Users} from './users.model';
import {MediaContents} from './media-contents.model';

@model()
class AccessReadObject {
  @property({
    type: 'number',
  })
  userId: number;
}

@model()
class OtherInformation {
  @property({
    type: 'string',
  })
  conversationName?: string;

  @property({
    type: 'string',
  })
  userName?: string;

  @property({
    type: 'number',
  })
  userId?: number;
}

@model()
export class Message extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
  })
  message?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: MESSAGE_TYPE,
    },
  })
  messageType?: string;

  @property({
    type: 'string',
  })
  locale?: string;

  @property({
    type: 'object',
  })
  otherInfo?: OtherInformation;

  @property({
    type: 'array',
    itemType: 'object',
  })
  attachments?: MediaContents[];

  @property({
    type: 'number',
  })
  postId?: number;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'array',
    itemType: 'object',
  })
  accessRead?: AccessReadObject[];

  @belongsTo(() => Conversation)
  conversationId: string;

  @belongsTo(() => Users)
  userId: number;

  constructor(data?: Partial<Message>) {
    super(data);
  }
}

export interface MessageRelations {
  // describe navigational properties here
}

export type MessageWithRelations = Message & MessageRelations;
