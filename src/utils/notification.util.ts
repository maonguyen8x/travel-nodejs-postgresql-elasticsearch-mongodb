import {
  bookingNotifyTypeMess,
  NOTIFICATION_ACCEPT_FOLLOW_MESSAGE,
  NOTIFICATION_COMMENT_MESSAGE,
  NOTIFICATION_COMMENT_MESSAGEV3,
  NOTIFICATION_FOLLOW_MESSAGE,
  NOTIFICATION_LIKE_COMMENT_MESSAGE,
  NOTIFICATION_LIKE_MESSAGE,
  NOTIFICATION_RANKING_MESSAGE,
  NOTIFICATION_RANKING_PAGE_MESSAGE,
  NOTIFICATION_REPLY_COMMENT_MESSAGE,
  NOTIFICATION_REPLY_RANKING_MESSAGE,
  NOTIFICATION_SHARE_MESSAGE,
  NOTIFICATION_TYPE_PAGE_STAY_ACCEPT_ORDER,
  NOTIFICATION_TYPE_PAGE_STAY_COMPLETED_ORDER,
  NOTIFICATION_TYPE_PAGE_STAY_REJECT_ORDER,
  NOTIFICATION_TYPE_PAGE_STAY_REQUEST_ORDER,
  NOTIFICATION_TYPE_PAGE_TOUR_ACCEPT_ORDER,
  NOTIFICATION_TYPE_PAGE_TOUR_COMPLETED_ORDER,
  NOTIFICATION_TYPE_PAGE_TOUR_REJECT_ORDER,
  NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER,
  NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW,
  NOTIFICATION_TYPE_USER_COMMENT_POST,
  NOTIFICATION_TYPE_USER_FOLLOW,
  NOTIFICATION_TYPE_USER_LIKE_COMMENT,
  NOTIFICATION_TYPE_USER_LIKE_POST,
  NOTIFICATION_TYPE_USER_LIKE_REPLY_COMMENT,
  NOTIFICATION_TYPE_USER_RANKING_POST,
  NOTIFICATION_TYPE_USER_RANKING_PAGE,
  NOTIFICATION_TYPE_USER_REPLY_COMMENT,
  NOTIFICATION_TYPE_USER_REPLY_RANKING,
  NOTIFICATION_TYPE_USER_SHARE_POST,
  NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER,
  NOTIFICATION_TYPE_PAGE_STAY_USER_REJECT_ORDER,
  NOTIFICATION_LIKE_MESSAGE_VN,
  NOTIFICATION_SHARE_MESSAGE_VN,
  NOTIFICATION_RANKING_MESSAGE_VN,
  NOTIFICATION_RANKING_PAGE_MESSAGE_VN,
  NOTIFICATION_COMMENT_MESSAGE_VN,
  NOTIFICATION_LIKE_COMMENT_MESSAGE_VN,
  NOTIFICATION_REPLY_COMMENT_MESSAGE_VN,
  NOTIFICATION_FOLLOW_MESSAGE_VN,
  NOTIFICATION_ACCEPT_FOLLOW_MESSAGE_VN,
  NOTIFICATION_REPLY_RANKING_MESSAGE_VN,
} from '../configs/notification-constants';
import {LANGUAGES} from '../configs/utils-constant';
import {Page, Users} from '../models';

export const handleGenerateNotifyBody = (
  language: string,
  notifyType: string,
  isOwner: boolean,
  eventCreator: string,
  postOwner?: string,
  comment?: string,
  childComment?: string,
  ranking?: {
    point?: number;
    review?: string;
  },
  replyRanking?: string,
): string => {
  if (notifyType === NOTIFICATION_TYPE_USER_LIKE_POST) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_LIKE_MESSAGE_VN}`
      : `${eventCreator} ${NOTIFICATION_LIKE_MESSAGE}`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_SHARE_POST) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_SHARE_MESSAGE_VN}`
      : `${eventCreator} ${NOTIFICATION_SHARE_MESSAGE}`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_RANKING_POST && ranking) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_RANKING_MESSAGE_VN} với điểm đánh giá ${ranking?.point} ${
          ranking?.review ? ': ' + ranking?.review : ''
        } `
      : `${eventCreator} ${NOTIFICATION_RANKING_MESSAGE} with point ${ranking?.point} ${
          ranking?.review ? ': ' + ranking?.review : ''
        } `;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_RANKING_PAGE) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_RANKING_PAGE_MESSAGE_VN}`
      : `${eventCreator} ${NOTIFICATION_RANKING_PAGE_MESSAGE}`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_COMMENT_POST && isOwner) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_COMMENT_MESSAGE_VN}: "${subString(comment || '')}"`
      : `${eventCreator} ${NOTIFICATION_COMMENT_MESSAGE}: "${subString(comment || '')}"`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_COMMENT_POST && !isOwner && postOwner) {
    return `${eventCreator} ${NOTIFICATION_COMMENT_MESSAGEV3(postOwner, language)}`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_LIKE_COMMENT && comment) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_LIKE_COMMENT_MESSAGE_VN}: "${subString(comment)}"`
      : `${eventCreator} ${NOTIFICATION_LIKE_COMMENT_MESSAGE}: "${subString(comment)}"`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_REPLY_COMMENT && childComment) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_REPLY_COMMENT_MESSAGE_VN}: "${subString(childComment)}"`
      : `${eventCreator} ${NOTIFICATION_REPLY_COMMENT_MESSAGE}: "${subString(childComment)}"`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_LIKE_REPLY_COMMENT && childComment) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_LIKE_COMMENT_MESSAGE_VN}: "${subString(childComment)}"`
      : `${eventCreator} ${NOTIFICATION_LIKE_COMMENT_MESSAGE}: "${subString(childComment)}"`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_FOLLOW) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_FOLLOW_MESSAGE_VN}`
      : `${eventCreator} ${NOTIFICATION_FOLLOW_MESSAGE}`;
  }
  if (notifyType === NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_ACCEPT_FOLLOW_MESSAGE_VN}`
      : `${eventCreator} ${NOTIFICATION_ACCEPT_FOLLOW_MESSAGE}`;
  }

  if (notifyType === NOTIFICATION_TYPE_USER_REPLY_RANKING && ranking && replyRanking) {
    return language === LANGUAGES.VI
      ? `${eventCreator} ${NOTIFICATION_REPLY_RANKING_MESSAGE_VN} ${ranking.review} : ${replyRanking}`
      : `${eventCreator} ${NOTIFICATION_REPLY_RANKING_MESSAGE} ${ranking.review} : ${replyRanking}`;
  }
  return '';
};

const subString = (msg: string) => {
  if (msg.length > 80) {
    return `${msg.slice(0, 80)}...`;
  }
  return msg;
};

export const getMessagePage = ({
  serviceName,
  customerName,
  notificationType,
  language,
}: {
  serviceName?: string;
  customerName?: string;
  notificationType?: string;
  language?: string;
}) => {
  return bookingNotifyTypeMess[String(notificationType || '')](serviceName, customerName, language);
};

export const mapEventUser = (customerUser: Users, page: Page) => {
  // relatedUserId là UserID của Page ( 1 Page là 1 User )
  const relatedUserId = page.relatedUserId;
  const customerUserId = customerUser?.id;
  return {
    [String(NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER)]: {
      userId: page.userId,
      relatedUserId,
      eventCreatorId: customerUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_TOUR_ACCEPT_ORDER)]: {
      userId: customerUserId,
      eventCreatorId: relatedUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_TOUR_REJECT_ORDER)]: {
      userId: customerUserId,
      eventCreatorId: relatedUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER)]: {
      userId: page.userId,
      relatedUserId,
      eventCreatorId: customerUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_TOUR_COMPLETED_ORDER)]: {
      userId: customerUserId,
      eventCreatorId: relatedUserId,
    },

    [String(NOTIFICATION_TYPE_PAGE_STAY_REQUEST_ORDER)]: {
      userId: page.userId,
      relatedUserId,
      eventCreatorId: customerUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_STAY_ACCEPT_ORDER)]: {
      userId: customerUserId,
      eventCreatorId: relatedUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_STAY_REJECT_ORDER)]: {
      userId: customerUserId,
      eventCreatorId: relatedUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_STAY_USER_REJECT_ORDER)]: {
      userId: page.userId,
      relatedUserId,
      eventCreatorId: customerUserId,
    },
    [String(NOTIFICATION_TYPE_PAGE_STAY_COMPLETED_ORDER)]: {
      userId: customerUserId,
      eventCreatorId: relatedUserId,
    },
  };
};
