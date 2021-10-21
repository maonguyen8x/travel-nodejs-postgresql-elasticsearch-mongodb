export enum ConversationTypesConstant {
  PAIR = 'PAIR',
  GROUP = 'GROUP',
  SYSTEM = 'SYSTEM',
}
const SIMPLE_MESSAGES = 'SIMPLE_MESSAGES';
const ATTACH_FILE_MESSAGE = 'ATTACH_FILE_MESSAGE';
const LINK_MESSAGE = 'LINK_MESSAGE';
const SHARE_POST_MESSAGE = 'SHARE_POST_MESSAGE';
const NOTIFICATION_MESSAGES_RENAME_CONVERSATION = 'NOTIFICATION_MESSAGES_RENAME_CONVERSATION';
const NOTIFICATION_MESSAGES_ADD_USER_TO_COVERSATION = 'NOTIFICATION_MESSAGES_ADD_USER_TO_COVERSATION';
const NOTIFICATION_MESSAGES_REMOVE_USER_FROM_COVERSATION = 'NOTIFICATION_MESSAGES_REMOVE_USER_FROM_COVERSATION';
const NOTIFICATION_MESSAGES_LEAVE_COVERSATION = 'NOTIFICATION_MESSAGES_LEAVE_COVERSATION';
const NOTIFICATION_MESSAGES_ASSIGN_ADMIN = 'NOTIFICATION_MESSAGES_ASSIGN_ADMIN';
const DELETED_MESSAGE = 'DELETED_MESSAGE';
const SYSTEM_MESSAGE = 'SYSTEM_MESSAGE';

export enum MessageConstants {
  simpleMessage = 'SIMPLE_MESSAGES',
  attachFileMessage = 'ATTACH_FILE_MESSAGE',
  linkMessage = 'LINK_MESSAGE',
  sharePostMessage = 'SHARE_POST_MESSAGE',
  renameConversationMessage = 'NOTIFICATION_MESSAGES_RENAME_CONVERSATION',
  addUserToConversationMessage = 'NOTIFICATION_MESSAGES_ADD_USER_TO_COVERSATION',
  removeUserFromConversationMessage = 'NOTIFICATION_MESSAGES_REMOVE_USER_FROM_COVERSATION',
  leaveConversationMessage = 'NOTIFICATION_MESSAGES_LEAVE_COVERSATION',
  assignAdmin = 'NOTIFICATION_MESSAGES_ASSIGN_ADMIN',
  deleteMessage = 'DELETED_MESSAGE',
  systemMessage = 'SYSTEM_MESSAGE',
}
export const MESSAGE_TYPE = [
  SIMPLE_MESSAGES,
  ATTACH_FILE_MESSAGE,
  LINK_MESSAGE,
  SHARE_POST_MESSAGE,
  NOTIFICATION_MESSAGES_RENAME_CONVERSATION,
  NOTIFICATION_MESSAGES_ADD_USER_TO_COVERSATION,
  NOTIFICATION_MESSAGES_REMOVE_USER_FROM_COVERSATION,
  NOTIFICATION_MESSAGES_LEAVE_COVERSATION,
  NOTIFICATION_MESSAGES_ASSIGN_ADMIN,
  DELETED_MESSAGE,
  SYSTEM_MESSAGE,
];

export enum AttachmentTypes {
  video = 'VIDEO',
  image = 'IMAGE',
  link = 'LINK',
}

export const TURN_ON_NOTIFY_CONVERSATION_SUCCESS = 'Turn on notify this conversation successful';
export const TURN_OFF_NOTIFY_CONVERSATION_SUCCESS = 'Turn off notify this conversation successful';

export const NOTIFICATION_TYPE_MESSAGE = 'MESSAGE';
export const MESSAGE_DEFAULT_JGOOOOO = JSON.stringify({
  vi:
    'Nhằm hỗ trợ cho việc kết nối đối với bạn bè quốc tế, đồng thời hỗ trợ việc học tiếng nước ngoài. Chúng tôi phát triển tính năng dịch đồng thời và sẽ ưu tiên phát triển việc bảo mật thông tin cho các cuộc hội thoại của bạn.',
  en:
    'With the intent to breakdown the language barrier, we provide you the translation feature. We respect your privacy; therefore, all chats are confidential and will be treated as such.',
});
