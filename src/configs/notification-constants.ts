import {BookingStatusEnum, BookingTypeEnum, RoleTypeEnum} from '../controllers/booking/booking.constant';
import moment from 'moment';
import {LANGUAGES} from './utils-constant';

export const NOTIFICATION_TYPE_EDIT_ACTIVITY = 'EDIT_ACTIVITY';
export const NOTIFICATION_TYPE_DELETE_ACTIVITY = 'DELETE_ACTIVITY';

export const NOTIFICATION_TYPE_USER_LIKE_POST = 'LIKE_POST';
export const NOTIFICATION_TYPE_USER_SHARE_POST = 'SHARE_POST';
export const NOTIFICATION_TYPE_USER_COMMENT_POST = 'COMMENT_POST';
export const NOTIFICATION_TYPE_USER_RANKING_POST = 'RANKING_POST';
export const NOTIFICATION_TYPE_USER_RANKING_PAGE = 'RANKING_PAGE';
export const NOTIFICATION_TYPE_USER_REPLY_RANKING = 'REPLY_RANKING';
export const NOTIFICATION_TYPE_USER_FOLLOW = 'FOLLOW_USER';
export const NOTIFICATION_TYPE_USER_ACCEPTED_FOLLOW = 'ACCEPTED_FOLLOW';
export const NOTIFICATION_TYPE_USER_LIKE_REPLY_COMMENT = 'LIKE_REPLY_COMMENT';
export const NOTIFICATION_TYPE_USER_LIKE_COMMENT = 'LIKE_COMMENT';
export const NOTIFICATION_TYPE_USER_LIKE_RANKING = 'LIKE_RANKING';
export const NOTIFICATION_TYPE_USER_REPLY_COMMENT = 'REPLY_COMMENT';
export const NOTIFICATION_TYPE_SYSTEM_NOTIFY = 'SYSTEM_NOTIFY';
export const NOTIFICATION_TYPE_SYSTEM_PROCESS_REPOST = 'PROCESS_REPORT';
export const NOTIFICATION_TYPE_SYSTEM_DELETE_POST_VIOLATION_OF_COMMUNITY_RULES =
  'SYSTEM_DELETE_POST_VIOLATION_OF_COMMUNITY_RULES';
export const NOTIFICATION_TYPE_SYSTEM_DELETE_FEEDBACK_INCORRECT_INFORMATION =
  'SYSTEM_DELETE_FEEDBACK_INCORRECT_INFORMATION';

export const NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER = 'TOUR_REQUEST_ORDER';
export const NOTIFICATION_TYPE_PAGE_TOUR_ACCEPT_ORDER = 'TOUR_ACCEPT_ORDER';
export const NOTIFICATION_TYPE_PAGE_TOUR_REJECT_ORDER = 'TOUR_REJECT_ORDER';
export const NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER = 'TOUR_USER_REJECT_ORDER';
export const NOTIFICATION_TYPE_PAGE_TOUR_COMPLETED_ORDER = 'TOUR_COMPLETED_ORDER';

export const NOTIFICATION_TYPE_PAGE_STAY_REQUEST_ORDER = 'STAY_REQUEST_ORDER';
export const NOTIFICATION_TYPE_PAGE_STAY_ACCEPT_ORDER = 'STAY_ACCEPT_ORDER';
export const NOTIFICATION_TYPE_PAGE_STAY_REJECT_ORDER = 'STAY_REJECT_ORDER';
export const NOTIFICATION_TYPE_PAGE_STAY_USER_REJECT_ORDER = 'STAY_USER_REJECT_ORDER';
export const NOTIFICATION_TYPE_PAGE_STAY_COMPLETED_ORDER = 'STAY_COMPLETED_ORDER';

export const NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE = 'PAGE_NEW_MESSAGE';

export const NOTIFICATION_TYPE_SYSTEM_ACCEPT_CHANGE_LOCATION_REQUEST = 'SYSTEM_ACCEPT_CHANGE_LOCATION_REQUEST';
export const NOTIFICATION_TYPE_SYSTEM_REJECT_CHANGE_LOCATION_REQUEST = 'SYSTEM_REJECT_CHANGE_LOCATION_REQUEST';

export const NOTIFICATION_TYPE_SYSTEM_CONFIRMED_VERIFY_PAGE_REQUEST = 'SYSTEM_CONFIRMED_VERIFY_PAGE_REQUEST';
export const NOTIFICATION_TYPE_SYSTEM_REJECT_VERIFY_PAGE_REQUEST = 'SYSTEM_REJECT_VERIFY_PAGE_REQUEST';

// admin notification type
export enum NotificationTypeAdminEnum {
  FEEDBACK_CREATE = 'SYSTEM_NEW_FEEDBACK',
  REPORT_CREATE = 'SYSTEM_NEW_REPORT',
  LOCATION_REQUEST_CREATE = 'SYSTEM_NEW_LOCATION_REQUEST',
}

export enum NotificationMessAdminEnum {
  SYSTEM_NEW_FEEDBACK = 'New feedback has been received',
  SYSTEM_NEW_FEEDBACK_VN = 'Phản hồi mới vừa được nhận',
  SYSTEM_NEW_REPORT = 'New report has been received',
  SYSTEM_NEW_REPORT_VN = 'Báo cáo mới vừa được nhận',
  SYSTEM_NEW_LOCATION_REQUEST = 'New request of changing location has been received',
  SYSTEM_NEW_LOCATION_REQUEST_VN = 'Yêu cầu thay đổi địa điểm mới vừa được nhận',
}

export const NOTIFICATION_STATUS_NEW = 'NEW';
export const NOTIFICATION_STATUS_READ = 'BEFORE';

export const NOTIFICATION_LIKE_MESSAGE = 'liked your post';
export const NOTIFICATION_LIKE_MESSAGE_VN = 'đã thích bài đăng của bạn';
export const NOTIFICATION_SHARE_MESSAGE = 'shared your post';
export const NOTIFICATION_SHARE_MESSAGE_VN = 'đã chia sẻ bài đăng của bạn';
export const NOTIFICATION_RANKING_MESSAGE = 'ranked your post';
export const NOTIFICATION_RANKING_MESSAGE_VN = 'đã xếp hạng bài đăng của bạn';
export const NOTIFICATION_RANKING_PAGE_MESSAGE = 'ranked your service';
export const NOTIFICATION_RANKING_PAGE_MESSAGE_VN = 'đã đánh giá về dịch vụ của bạn';
export const NOTIFICATION_COMMENT_MESSAGE = 'commented your post';
export const NOTIFICATION_COMMENT_MESSAGE_VN = 'đã bình luận bài đăng của bạn';
export const NOTIFICATION_REPLY_COMMENT_MESSAGE = 'replied to your comment';
export const NOTIFICATION_REPLY_COMMENT_MESSAGE_VN = 'đã phản hồi bài đăng của bạn';
export const NOTIFICATION_LIKE_COMMENT_MESSAGE = 'liked your comment';
export const NOTIFICATION_LIKE_COMMENT_MESSAGE_VN = 'đã thích bình luận của bạn';
export const NOTIFICATION_FOLLOW_MESSAGE = 'sent you a follow request';
export const NOTIFICATION_FOLLOW_MESSAGE_VN = 'đã gửi bạn một yêu cầu theo dõi';
export const NOTIFICATION_ACCEPT_FOLLOW_MESSAGE = 'accepted your request';
export const NOTIFICATION_ACCEPT_FOLLOW_MESSAGE_VN = 'đã chấp nhận yêu cầu của bạn';
export const NOTIFICATION_REPLY_RANKING_MESSAGE = 'replied to your ranking';
export const NOTIFICATION_REPLY_RANKING_MESSAGE_VN = 'đã phản hồi xếp hạng của bạn';
export function NOTIFICATION_COMMENT_MESSAGEV3(userName: string, language: string) {
  return language === LANGUAGES.VI ? `đã bình luận bài đăng của ${userName}` : `also commented ${userName}'s post`;
}
export function NOTIFICATION_PAGE_REQUEST_TOUR(serviceName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Bạn nhận một yêu cầu đặt tour ${serviceName} từ khách hàng ${customerName}`
    : `You receive a request to book a ${serviceName} tour from a customer ${customerName}`;
}
export function NOTIFICATION_PAGE_REJECT_TOUR(serviceName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Đơn vị lữ hành ${serviceName} vừa từ chối yêu cầu đặt Tour của bạn. Chúng tôi xin lỗi về bất tiện này. Hãy thử tìm những tour tương tự khác.`
    : `Tour provider ${serviceName} has declined your request to book a Tour. We are sorry about this. Try it with some other tours.`;
}
export function NOTIFICATION_PAGE_USER_REJECT_TOUR(serviceName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `${customerName} đã hủy đặt Tour ${serviceName}.`
    : `${customerName} canceled their booking from ${serviceName}.`;
}
export function NOTIFICATION_PAGE_ACCEPT_TOUR(serviceName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Yêu cầu đặt Tour của bạn vừa được xác nhận bởi đơn vị cung cấp dịch vụ. Chúc bạn có một chuyến đi tuyệt vời với nhiều kỷ niệm.`
    : `Your Tour booking request has been confirmed by your service provider. Have a nice trip and lots of memories. `;
}
export function NOTIFICATION_PAGE_COMPLETED_TOUR(serviceName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Chúng tôi hi vọng bạn vừa có một trải nghiệm thật tuyệt, việc để lại đánh giá của bạn sẽ hỗ trợ người cung cấp dịch vụ cải thiện chất lượng dịch vụ được tốt hơn. `
    : `We hope you have had a good time, leaving your review as a way for service providers to improve the quality of their service to their customers. `;
}

export function NOTIFICATION_PAGE_REQUEST_STAY(providerName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Bạn nhận một yêu cầu đặt dịch vụ ${providerName} từ khách hàng ${customerName}`
    : `You receive a request to book for ${providerName} from a customer ${customerName}`;
}
export function NOTIFICATION_PAGE_REJECT_STAY(providerName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `${providerName} vừa từ chối yều đặt phòng. Chúng tôi xin lỗi về bất tiện này. Hãy thử tìm những địa điểm lưu trú khác.`
    : `${providerName} has declined your request to book a Stay. We are sorry about this. Try it with some other stays.`;
}
export function NOTIFICATION_PAGE_USER_REJECT_STAY(serviceName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `${customerName} đã hủy đặt phòng tại ${serviceName}.`
    : `${customerName} canceled their booking from ${serviceName}.`;
}
export function NOTIFICATION_PAGE_ACCEPT_STAY(providerName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Yêu cầu đặt phòng của bạn vừa được xác nhận bởi đơn vị cung cấp dịch vụ. Chúc bạn có một chuyến đi tuyệt vời với nhiều kỷ niệm.`
    : `Your Stay booking request has been confirmed by ${providerName}. Have a nice trip and lots of memories. `;
}
export function NOTIFICATION_PAGE_COMPLETED_STAY(providerName?: string, customerName?: string, language?: string) {
  return language === LANGUAGES.VI
    ? `Chúng tôi hi vọng bạn vừa có một trải nghiệm thật tuyệt, việc để lại đánh giá của bạn sẽ hỗ trợ người cung cấp dịch vụ cải thiện chất lượng dịch vụ được tốt hơn. `
    : `We hope you have had a good time, leaving your review as a way for service providers to improve the quality of their service to their customers. `;
}

export function NOTIFICATION_STATUS() {
  return [NOTIFICATION_STATUS_NEW, NOTIFICATION_STATUS_READ];
}

export const bookingNotifyType = {
  [String(BookingStatusEnum.request)]: (bookingType: string) => {
    const serviceNotify = {
      [String(BookingTypeEnum.tour)]: NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER,
      [String(BookingTypeEnum.stay)]: NOTIFICATION_TYPE_PAGE_STAY_REQUEST_ORDER,
    };
    return serviceNotify[String(bookingType)];
  },
  [String(BookingStatusEnum.confirmed)]: (bookingType: string) => {
    const serviceNotify = {
      [String(BookingTypeEnum.tour)]: NOTIFICATION_TYPE_PAGE_TOUR_ACCEPT_ORDER,
      [String(BookingTypeEnum.stay)]: NOTIFICATION_TYPE_PAGE_STAY_ACCEPT_ORDER,
    };
    return serviceNotify[String(bookingType)];
  },
  [String(BookingStatusEnum.canceled)]: (bookingType: string, cancelBy?: string) => {
    const serviceNotify =
      cancelBy === RoleTypeEnum.user
        ? {
            [String(BookingTypeEnum.tour)]: NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER,
            [String(BookingTypeEnum.stay)]: NOTIFICATION_TYPE_PAGE_STAY_USER_REJECT_ORDER,
          }
        : {
            [String(BookingTypeEnum.tour)]: NOTIFICATION_TYPE_PAGE_TOUR_REJECT_ORDER,
            [String(BookingTypeEnum.stay)]: NOTIFICATION_TYPE_PAGE_STAY_REJECT_ORDER,
          };

    return serviceNotify[String(bookingType)];
  },
  [String(BookingStatusEnum.completed)]: (bookingType: string) => {
    const serviceNotify = {
      [String(BookingTypeEnum.tour)]: NOTIFICATION_TYPE_PAGE_TOUR_COMPLETED_ORDER,
      [String(BookingTypeEnum.stay)]: NOTIFICATION_TYPE_PAGE_STAY_COMPLETED_ORDER,
    };
    return serviceNotify[String(bookingType)];
  },
};

export const bookingNotifyTypeMess = {
  [String(NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER)]: NOTIFICATION_PAGE_REQUEST_TOUR,
  [String(NOTIFICATION_TYPE_PAGE_TOUR_ACCEPT_ORDER)]: NOTIFICATION_PAGE_ACCEPT_TOUR,
  [String(NOTIFICATION_TYPE_PAGE_TOUR_REJECT_ORDER)]: NOTIFICATION_PAGE_REJECT_TOUR,
  [String(NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER)]: NOTIFICATION_PAGE_USER_REJECT_TOUR,
  [String(NOTIFICATION_TYPE_PAGE_TOUR_COMPLETED_ORDER)]: NOTIFICATION_PAGE_COMPLETED_TOUR,

  [String(NOTIFICATION_TYPE_PAGE_STAY_REQUEST_ORDER)]: NOTIFICATION_PAGE_REQUEST_STAY,
  [String(NOTIFICATION_TYPE_PAGE_STAY_ACCEPT_ORDER)]: NOTIFICATION_PAGE_ACCEPT_STAY,
  [String(NOTIFICATION_TYPE_PAGE_STAY_REJECT_ORDER)]: NOTIFICATION_PAGE_REJECT_STAY,
  [String(NOTIFICATION_TYPE_PAGE_STAY_USER_REJECT_ORDER)]: NOTIFICATION_PAGE_USER_REJECT_STAY,
  [String(NOTIFICATION_TYPE_PAGE_STAY_COMPLETED_ORDER)]: NOTIFICATION_PAGE_COMPLETED_STAY,
};

export const bookingNotifyObjectUser = {
  [String(NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER)]: (userId?: number, custormerId?: number) => {
    return {
      userId: userId,
      eventCreatorId: custormerId,
    };
  },
  [String(NOTIFICATION_TYPE_PAGE_TOUR_ACCEPT_ORDER)]: (userId?: number, custormerId?: number) => {
    return {
      userId: custormerId,
      eventCreatorId: userId,
    };
  },
  [String(NOTIFICATION_TYPE_PAGE_TOUR_REJECT_ORDER)]: (userId?: number, custormerId?: number) => {
    return {
      userId: custormerId,
      eventCreatorId: userId,
    };
  },
  [String(NOTIFICATION_TYPE_PAGE_TOUR_COMPLETED_ORDER)]: (userId?: number, custormerId?: number) => {
    return {
      userId: custormerId,
      eventCreatorId: userId,
    };
  },
};

export enum notifyForEnum {
  owner = 'OWNER',
  page = 'PAGE',
  user = 'USER',
}

export const actionMessForPage = {
  [String(NOTIFICATION_TYPE_USER_LIKE_POST)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 lượt thích mới` : `${pageName} has 1 new like`,
  [String(NOTIFICATION_TYPE_USER_LIKE_REPLY_COMMENT)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 lượt thích mới` : `${pageName} has 1 new like`,
  [String(NOTIFICATION_TYPE_USER_LIKE_COMMENT)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 lượt thích mới` : `${pageName} has 1 new like`,
  [String(NOTIFICATION_TYPE_USER_LIKE_RANKING)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 lượt thích mới` : `${pageName} has 1 new like`,

  [String(NOTIFICATION_TYPE_USER_SHARE_POST)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 lượt chia sẻ mới` : `${pageName} has 1 new share`,

  [String(NOTIFICATION_TYPE_USER_COMMENT_POST)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 nhận xét mới` : `${pageName} has 1 new comment`,
  [String(NOTIFICATION_TYPE_USER_REPLY_COMMENT)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 nhận xét mới` : `${pageName} has 1 new comment`,

  [String(NOTIFICATION_TYPE_USER_RANKING_POST)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 xếp hạng mới` : `${pageName} has 1 new ranking`,

  [String(NOTIFICATION_TYPE_USER_RANKING_PAGE)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI
      ? `${pageName} có 1 đánh giá mới về dịch vụ`
      : `${pageName} has 1 new ranking about service`,

  [String(NOTIFICATION_TYPE_USER_FOLLOW)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 theo dõi mới` : `${pageName} has 1 new follow`,

  [String(NOTIFICATION_TYPE_PAGE_TOUR_REQUEST_ORDER)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 yêu cầu đặt hàng mới` : `${pageName} has 1 new order request`,

  [String(NOTIFICATION_TYPE_PAGE_STAY_REQUEST_ORDER)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI ? `${pageName} có 1 yêu cầu đặt hàng mới` : `${pageName} has 1 new order request`,

  [String(NOTIFICATION_TYPE_PAGE_STAY_USER_REJECT_ORDER)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI
      ? `${pageName} có 1 yêu cầu hủy đặt hàng mới`
      : `${pageName} has 1 new canceled order request`,

  [String(NOTIFICATION_TYPE_PAGE_TOUR_USER_REJECT_ORDER)]: (pageName: string, language: string) =>
    language === LANGUAGES.VI
      ? `${pageName} có 1 yêu cầu hủy đặt hàng mới`
      : `${pageName} has 1 new canceled order request`,
};

export const NotificationSystemMessage = {
  [String(NOTIFICATION_TYPE_SYSTEM_ACCEPT_CHANGE_LOCATION_REQUEST)]: (data?: NotificationSystemMessageInputInterface) =>
    'Your request change location had been accepted',
  [String(NOTIFICATION_TYPE_SYSTEM_REJECT_CHANGE_LOCATION_REQUEST)]: (data?: NotificationSystemMessageInputInterface) =>
    'Your request change location had been rejected',
  [String(NOTIFICATION_TYPE_SYSTEM_CONFIRMED_VERIFY_PAGE_REQUEST)]: (
    data?: NotificationSystemMessageInputInterface,
  ) => {
    return `Authentication request for ${data?.pageName} service page has been confirmed.`;
  },
  [String(NOTIFICATION_TYPE_SYSTEM_REJECT_VERIFY_PAGE_REQUEST)]: (data?: NotificationSystemMessageInputInterface) => {
    return `Authentication request for ${data?.pageName} service page has been denied: ${data?.messageContent}.`;
  },
};
export interface NotificationSystemMessageInputInterface {
  pageName?: string;
  messageContent?: string;
}

export enum ActivityNotifyTypeEnum {
  invite = 'INVITE_ACTIVITY',
  remove = 'REMOVE_ACTIVITY',
  join = 'JOIN_ACTIVITY',
  comingSoon = 'COMING_SOON_ACTIVITY',
}

export const ActivityNotifyMessge = {
  [String(ActivityNotifyTypeEnum.invite)]: (data: ActivityNotifyInputInterface) => {
    return data.language === LANGUAGES.VI
      ? `Bạn vừa nhận được một lời mời để tham gia sự kiện "${data.activityName}" từ ${data.eventCreatorName}`
      : `You have received an invitation to join the event "${data.activityName}" from ${data.eventCreatorName}`;
  },
  [String(ActivityNotifyTypeEnum.remove)]: (data: ActivityNotifyInputInterface) => {
    return data.language === LANGUAGES.VI
      ? `${data.eventCreatorName} vừa xóa bạn khỏi danh sách những người tham dự sự kiện "${data.activityName}"`
      : `${data.eventCreatorName} has removed you from the list of participants for the event "${data.activityName}"`;
  },
  [String(ActivityNotifyTypeEnum.join)]: (data: ActivityNotifyInputInterface) => {
    return data.language === LANGUAGES.VI
      ? `${data.eventCreatorName} vừa đăng ký tham dự sự kiện "${data.activityName}". `
      : `${data.eventCreatorName} has registered to attend the "${data.activityName}" event. `;
  },
  [String(ActivityNotifyTypeEnum.comingSoon)]: (data: ActivityNotifyInputInterface) => {
    return data.language === LANGUAGES.VI
      ? `Một sự kiện bạn tham gia sẽ diễn ra ngày mai vào lúc ${moment(data.startTime).utc().hour()}.`
      : `An event you join will be taking place tomorrow at ${moment(data.startTime).utc().hour()}.`;
  },
};
export interface ActivityNotifyInputInterface {
  language?: string;
  activityName?: string;
  eventCreatorName?: string;
  startTime?: string;
}
