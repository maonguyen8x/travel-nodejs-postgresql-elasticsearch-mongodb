import {Conversation, UsersRelations, Users, Message, UsersWithRelations, Page} from '../../models';

export interface ConversationInterface extends Conversation {
  totalMessages: number;
  isNotify: boolean;
  blockStatus?: StatusBlock;
}

export interface StatusBlock {
  isBlockedTargetUser?: boolean;
  isTargetUserBlockedMe?: boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface ConversationResponseInterface extends Conversation {
  participants?: Partial<Users & UsersRelations>[];
  contributors?: Partial<Users & UsersRelations>[];
  lastestMessage?: Message;
  countUnRead: number;
  blockStatus?: StatusBlock;
}

export interface ParticipantHasPageInfoInterface extends Partial<UsersWithRelations> {
  page?: Page;
  ownerUser?: Partial<UsersWithRelations>;
}
