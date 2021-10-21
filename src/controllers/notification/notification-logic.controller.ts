// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

import {inject} from '@loopback/context';
import {AnyObject, Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {get as path, omit} from 'lodash';
import {
  actionMessForPage,
  ActivityNotifyMessge,
  ActivityNotifyTypeEnum,
  NOTIFICATION_STATUS_NEW,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE,
  NotificationMessAdminEnum,
  NotificationTypeAdminEnum,
  notifyForEnum,
} from '../../configs/notification-constants';
import {
  ActivityRepository,
  BookingRepository,
  NotificationRepository,
  PageRepository,
  ServiceRepository,
  UsersRepository,
} from '../../repositories';
import {FirebaseService} from '../../services';
import {userInfoQuery} from '../specs/user-controller.specs';
import {Feedback, LocationRequests, Notification, Report, Users} from '../../models';
import {USER_TYPE_ACCESS_ADMIN, USER_TYPE_ACCESS_PAGE} from '../../configs/user-constants';
import {notificationQuery} from './notification.controller';
import {handleError} from '../../utils/handleError';
import {asyncLimiter} from '../../utils/Async-limiter';
import {getMessagePage, handleGenerateNotifyBody, mapEventUser} from '../../utils/notification.util';
import {LocationTypesEnum} from '../../configs/location-constant';
import {LANGUAGES} from '../../configs/utils-constant';

export class NotificationLogicController {
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(BookingRepository)
    public bookingRepository: BookingRepository,
    @repository(ServiceRepository)
    public serviceRepository: ServiceRepository,
    @inject('firebase')
    public firebaseService: FirebaseService,
    @repository(ActivityRepository)
    public activityRepository: ActivityRepository,
  ) {}

  async createNotification(data: {
    listUserReceive: number[];
    notificationType: string;
    eventCreatorId?: number;
    targetPost?: number;
    commentId?: number;
    childCommentId?: number;
    rankingId?: number;
    replyRankingId?: number;
    conversationId?: string;
    pageReviewId?: number;
  }): Promise<void> {
    try {
      const listUser = new Set(data.listUserReceive);
      if (data.notificationType === NOTIFICATION_TYPE_PAGE_HAS_NEW_MESSAGE) {
        return await this.handleNotificationPageNewMessage({
          ...data,
          listUser: Array.from(listUser),
        });
      }
      Array.from(listUser).map(async (item) => {
        if (item !== data.eventCreatorId) {
          let userId = item;
          let pageId: number | undefined = 0;
          let notificationFor = notifyForEnum.user;
          const user = await this.usersRepository.findById(userId);
          if (user?.userTypeAccess === USER_TYPE_ACCESS_PAGE) {
            const page = await this.pageRepository.findOne({
              where: {
                relatedUserId: user.id,
              },
            });
            if (page) {
              userId = page.userId;
              pageId = page.id;
              notificationFor = notifyForEnum.page;
            }
          }
          const newNotification = await this.notificationRepository.create({
            status: NOTIFICATION_STATUS_NEW,
            notificationType: data.notificationType,
            userId: item,
            eventCreatorId: data.eventCreatorId,
            participants: `${data.eventCreatorId}`,
            targetPostId: data.targetPost,
            commentId: data.commentId,
            childCommentId: data.childCommentId,
            ...(data.rankingId && {
              rankingId: data.rankingId,
            }),
            ...(data.replyRankingId && {
              replyRankingId: data.replyRankingId,
            }),
            ...(data.pageReviewId && {
              pageReviewId: data.pageReviewId,
            }),
            notificationFor: notificationFor,
          });
          const notify = await this.notificationRepository.findById(newNotification.id, {
            include: [
              {
                relation: 'eventCreator',
                scope: {
                  ...userInfoQuery(true),
                },
              },
              {
                relation: 'targetPost',
                scope: {
                  include: [
                    {
                      relation: 'creator',
                    },
                  ],
                },
              },
              {
                relation: 'comment',
              },
              {
                relation: 'childComment',
              },
              {
                relation: 'ranking',
              },
              {
                relation: 'replyRanking',
              },
            ],
          });
          if (pageId) {
            const newNotify = omit(notify, [
              'id',
              'targetPost',
              'eventCreator',
              'comment',
              'childComment',
              'ranking',
              'replyRanking',
            ]);
            await Promise.all([
              this.notificationRepository.create({
                ...newNotify,
                participants: `${data.eventCreatorId}`,
                userId,
                notificationFor: notifyForEnum.owner,
                pageId,
              }),
              this.sendCloudNotificationToDeviceForPage({
                notification: notify,
                pageId,
                userId,
              }),
            ]);
          } else {
            await this.sendCloudNotificationToDeviceForUser({
              notification: notify,
              userId,
            });
          }
        }
      });
    } catch (error) {
      return handleError(error);
    }
  }

  async createNotifyBookingPage(notifyInfo: {
    cancelBy?: string;
    bookingId?: number;
    type?: string;
    notificationType?: string;
  }) {
    const booking = await this.bookingRepository.findById(notifyInfo.bookingId);
    const [page, customerUser, service] = await Promise.all([
      this.pageRepository.findById(booking?.pageId),
      this.usersRepository.findById(booking.createdById),
      this.serviceRepository.findById(booking.serviceId),
    ]);

    const isPageTour = page.type === LocationTypesEnum.tour;
    const mapEventObject = mapEventUser(customerUser, page);
    const {userId, relatedUserId, eventCreatorId} = mapEventObject[String(notifyInfo.notificationType)];

    if (relatedUserId) {
      await this.notificationRepository.create({
        status: NOTIFICATION_STATUS_NEW,
        notificationType: notifyInfo.notificationType,
        userId: relatedUserId,
        eventCreatorId: eventCreatorId,
        bookingId: booking.id,
        pageId: page.id,
        cancelBy: notifyInfo.cancelBy,
        notificationFor: notifyForEnum.page,
      });
    }
    const newNotification = await this.notificationRepository.create({
      status: NOTIFICATION_STATUS_NEW,
      notificationType: notifyInfo.notificationType,
      userId,
      eventCreatorId: eventCreatorId,
      bookingId: booking.id,
      pageId: page.id,
      notificationFor: relatedUserId ? notifyForEnum.owner : notifyForEnum.user,
      cancelBy: notifyInfo.cancelBy,
    });

    const notify = await this.notificationRepository.findById(newNotification?.id, {
      include: [
        {
          relation: 'eventCreator',
          scope: {
            ...userInfoQuery(true),
          },
        },
      ],
    });
    const userReceiveId = notify?.userId;
    if (relatedUserId) {
      await this.sendCloudNotificationToDeviceForPage({
        pageId: page.id || 0,
        notification: notify,
        userId: userReceiveId,
      });
    } else {
      const body = {
        serviceName: isPageTour ? service?.name : page.name,
        customerName: customerUser?.name,
        notificationType: newNotification?.notificationType,
      };
      await this.sendCloudNotificationToDeviceForUser({
        notification: notify,
        userId: userReceiveId,
        body,
      });
    }
  }

  async handleNotificationPageNewMessage(data: {
    notificationType: string;
    eventCreatorId?: number;
    conversationId?: string;
    listUser: number[];
  }): Promise<void> {
    await Promise.all(
      data.listUser.map((userId) =>
        this.createNotificationPageMessage({
          userId,
          notificationType: data.notificationType,
          eventCreatorId: data.eventCreatorId,
          conversationId: data.conversationId,
        }),
      ),
    );
  }

  async createNotificationPageMessage({
    userId,
    notificationType,
    eventCreatorId,
    conversationId,
  }: {
    userId: number;
    notificationType: string;
    eventCreatorId?: number;
    conversationId?: string;
  }): Promise<void> {
    const user = await this.usersRepository.findById(userId, {
      include: [
        {
          relation: 'page',
        },
      ],
    });
    const page = user?.page;
    const ownerUser = await this.usersRepository.findById(page.userId);
    const notificationForOwner = await this.notificationRepository.create({
      status: NOTIFICATION_STATUS_NEW,
      notificationType: notificationType,
      userId: ownerUser.id,
      eventCreatorId: eventCreatorId,
      notificationFor: notifyForEnum.owner,
      conversationId: conversationId,
      pageId: page.id,
    });
    const notify = await this.notificationRepository.findById(notificationForOwner?.id, {
      include: [
        {
          relation: 'eventCreator',
          scope: {
            ...userInfoQuery(true),
          },
        },
      ],
    });
    const image = String(path(notify, ['eventCreator', 'profiles', 'avatars', 'mediaContent', 'url']));
    const listDeviceToken = await this.usersRepository.deviceInfos(ownerUser.id).find();
    const listToken = listDeviceToken
      .map(function (item) {
        return {
          deviceToken: item.deviceToken || '',
          language: item.language || LANGUAGES.EN,
        };
      })
      .filter((item) => item);
    const count = await this.notificationRepository.count({
      userId: notify.userId,
      read: false,
    });
    listToken.forEach((item) => {
      this.firebaseService.message
        .sendToDevice(
          item.deviceToken,
          {
            data: {
              status: String(notify?.status),
              notificationType: String(notify?.notificationType),
              userId: String(notify?.userId),
              eventCreatorId: String(notify?.eventCreatorId),
              countNew: String(count.count),
              id: String(notify?.id),
              pageId: String(notify?.pageId),
              picture: image,
              notificationFor: String(notifyForEnum.page),
            },
            notification: {
              body:
                item.language === LANGUAGES.VI ? `${page?.name} có 1 tin nhắn mới` : `${page?.name} has 1 new message`,
              imageUrl: image,
              image: image,
              badge: String(count.count),
              sound: 'bingbong.aiff',
            },
          },
          {
            contentAvailable: true,
            mutableContent: true,
          },
        )
        .then((result) => {})
        .catch((err) => {});
    });
  }

  async find({
    userId,
    filter,
  }: {
    userId: number;
    filter?: Filter<Notification>;
  }): Promise<{
    count: number;
    data: Notification[];
  }> {
    try {
      const ctrFilter = {
        ...notificationQuery(),
        order: ['createdAt DESC'],
        ...filter,
        where: {
          ...filter?.where,
          userId: userId,
        },
      };
      const count = await this.notificationRepository.count(ctrFilter.where);
      const promise = (await this.notificationRepository.find(ctrFilter)).map(async (notification) => {
        if (
          [
            String(ActivityNotifyTypeEnum.remove),
            String(ActivityNotifyTypeEnum.invite),
            String(ActivityNotifyTypeEnum.join),
            String(ActivityNotifyTypeEnum.comingSoon),
          ].includes(String(notification?.notificationType))
        ) {
          const activity = await this.activityRepository.findById(notification?.metadata?.activityId);
          return {
            ...notification,
            activity,
          };
        }
        return {
          ...notification,
        };
      });
      const result = await asyncLimiter(promise);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.usersRepository.notifications(userId).patch(
        {read: true},
        {
          userId,
        },
      );

      return {
        count: count.count,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        data: result.map((item) => {
          return {
            ...item,
            ...(item.eventCreator
              ? {
                  eventCreator: this.usersRepository.convertDataUser(item.eventCreator),
                }
              : {}),
          };
        }),
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findById({
    id,
    filter,
  }: {
    userId: number;
    id: number;
    filter?: FilterExcludingWhere<Notification>;
  }): Promise<Notification> {
    const ctr = {
      ...notificationQuery(),
      filter,
    };
    const result = await this.notificationRepository.findById(id, ctr);
    await this.notificationRepository.updateById(id, {
      status: NOTIFICATION_STATUS_READ,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
      ...result,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      ...(result.eventCreator
        ? {
            eventCreator: this.usersRepository.convertDataUser(result.eventCreator),
          }
        : {}),
    };
  }

  async notifyForAdmin({
    feedback,
    report,
    locationRequests,
  }: {
    feedback?: Feedback;
    report?: Report;
    locationRequests?: LocationRequests;
  }): Promise<void> {
    const listAdmin = await this.usersRepository.find({
      where: {
        userTypeAccess: USER_TYPE_ACCESS_ADMIN,
      },
    });
    if (feedback) {
      await this.sendNotificationFeedbackAdmin(feedback, listAdmin);
    }
    if (report) {
      await this.sendNotificationReportAdmin(report, listAdmin);
    }
    if (locationRequests) {
      await this.sendNotificationLocationRequestsAdmin(locationRequests, listAdmin);
    }
  }

  async sendNotificationFeedbackAdmin(feedback: Feedback, listAdmin: Users[]): Promise<void> {
    try {
      const process = listAdmin.map(async (admin) => {
        const [notification, listDeviceToken, count] = await Promise.all([
          this.notificationRepository.create({
            status: NOTIFICATION_STATUS_NEW,
            feedbackId: feedback.id,
            userId: admin.id,
            notificationType: NotificationTypeAdminEnum.FEEDBACK_CREATE,
            eventCreatorId: feedback.userId,
            notificationFor: notifyForEnum.user,
          }),
          this.usersRepository.deviceInfos(admin.id).find(),
          this.notificationRepository.count({
            userId: admin.id,
            read: false,
          }),
        ]);

        const listToken = listDeviceToken
          .map(function (item) {
            return {
              deviceToken: item.deviceToken || '',
              language: item.language || LANGUAGES.EN,
            };
          })
          .filter((item) => item);
        listToken.forEach((item) => {
          this.firebaseService.message
            .sendToDevice(
              item.deviceToken,
              {
                data: {
                  status: String(notification?.status),
                  notificationType: String(notification?.notificationType),
                  userId: String(notification?.userId),
                  feedbackId: String(notification?.feedbackId),
                  eventCreatorId: String(notification?.eventCreatorId),
                  countNew: String(count.count),
                  id: String(notification?.id),
                },
                notification: {
                  body:
                    item.language === LANGUAGES.VI
                      ? NotificationMessAdminEnum.SYSTEM_NEW_FEEDBACK_VN
                      : NotificationMessAdminEnum.SYSTEM_NEW_FEEDBACK,
                  // imageUrl: image,
                  // image: image,
                  badge: String(count.count),
                  sound: 'bingbong.aiff',
                },
              },
              {
                contentAvailable: true,
                mutableContent: true,
              },
            )
            .then(() => {})
            .catch(() => {});
        });
      });

      await Promise.all(process);
    } catch (e) {
      return handleError(e);
    }
  }

  async sendNotificationReportAdmin(report: Report, listAdmin: Users[]): Promise<void> {
    try {
      const process = listAdmin.map(async (admin) => {
        const notification = await this.notificationRepository.create({
          status: NOTIFICATION_STATUS_NEW,
          reportId: report.id,
          userId: admin.id,
          notificationType: NotificationTypeAdminEnum.REPORT_CREATE,
          eventCreatorId: report.userId,
          notificationFor: notifyForEnum.user,
        });
        const listDeviceToken = await this.usersRepository.deviceInfos(admin.id).find();
        const listToken = listDeviceToken
          .map(function (item) {
            return {
              deviceToken: item.deviceToken || '',
              language: item.language || LANGUAGES.EN,
            };
          })
          .filter((item) => item);
        const count = await this.notificationRepository.count({
          userId: admin.id,
          read: false,
        });
        listToken.forEach((item) => {
          this.firebaseService.message
            .sendToDevice(
              item.deviceToken,
              {
                data: {
                  status: String(notification?.status),
                  notificationType: String(notification?.notificationType),
                  userId: String(notification?.userId),
                  reportId: String(notification?.reportId),
                  eventCreatorId: String(notification?.eventCreatorId),
                  countNew: String(count.count),
                  id: String(notification?.id),
                },
                notification: {
                  body:
                    item.language === LANGUAGES.VI
                      ? NotificationMessAdminEnum.SYSTEM_NEW_REPORT_VN
                      : NotificationMessAdminEnum.SYSTEM_NEW_REPORT,
                  // imageUrl: image,
                  // image: image,
                  badge: String(count.count),
                  sound: 'bingbong.aiff',
                },
              },
              {
                contentAvailable: true,
                mutableContent: true,
              },
            )
            .then(() => {})
            .catch(() => {});
        });
      });

      await Promise.all(process);
    } catch (e) {
      return handleError(e);
    }
  }

  async sendNotificationLocationRequestsAdmin(locationRequests: LocationRequests, listAdmin: Users[]): Promise<void> {
    try {
      const process = listAdmin.map(async (admin) => {
        const notification = await this.notificationRepository.create({
          status: NOTIFICATION_STATUS_NEW,
          locationRequestId: locationRequests.id,
          userId: admin.id,
          notificationType: NotificationTypeAdminEnum.LOCATION_REQUEST_CREATE,
          eventCreatorId: locationRequests.userId,
          notificationFor: notifyForEnum.user,
        });
        const listDeviceToken = await this.usersRepository.deviceInfos(admin.id).find();
        const listToken = listDeviceToken
          .map(function (item) {
            return {
              deviceToken: item.deviceToken || '',
              language: item.language || LANGUAGES.EN,
            };
          })
          .filter((item) => item);
        const count = await this.notificationRepository.count({
          userId: admin.id,
          read: false,
        });
        listToken.forEach((item) => {
          this.firebaseService.message
            .sendToDevice(
              item.deviceToken,
              {
                data: {
                  status: String(notification?.status),
                  notificationType: String(notification?.notificationType),
                  userId: String(notification?.userId),
                  locationRequestId: String(notification?.locationRequestId),
                  eventCreatorId: String(notification?.eventCreatorId),
                  countNew: String(count.count),
                  id: String(notification?.id),
                },
                notification: {
                  body:
                    item.language === LANGUAGES.VI
                      ? NotificationMessAdminEnum.SYSTEM_NEW_LOCATION_REQUEST_VN
                      : NotificationMessAdminEnum.SYSTEM_NEW_LOCATION_REQUEST,
                  // imageUrl: image,
                  // image: image,
                  badge: String(count.count),
                  sound: 'bingbong.aiff',
                },
              },
              {
                contentAvailable: true,
                mutableContent: true,
              },
            )
            .then(() => {})
            .catch(() => {});
        });
      });

      await Promise.all(process);
    } catch (e) {
      return handleError(e);
    }
  }

  async createNotifyActivity(notifyInfo: {
    eventCreatorId?: number;
    activityId?: number;
    type?: string;
    userIds: number[];
  }) {
    try {
      const activity = await this.activityRepository.findById(notifyInfo.activityId, {
        include: [
          {
            relation: 'post',
            scope: {
              include: [
                {
                  relation: 'mediaContents',
                },
              ],
            },
          },
        ],
      });
      const eventCreator = notifyInfo.eventCreatorId
        ? await this.usersRepository.findById(notifyInfo.eventCreatorId)
        : null;

      const image =
        notifyInfo.type === ActivityNotifyTypeEnum.comingSoon
          ? String(path(activity, ['post', 'mediaContents', 0, 'url']))
          : String(path(eventCreator, ['profiles', 'avatars', 'mediaContent', 'url']));
      const promise = notifyInfo?.userIds.map(async (userId: number) => {
        const newNotification = await this.notificationRepository.create({
          status: NOTIFICATION_STATUS_NEW,
          notificationType: notifyInfo.type,
          userId,
          eventCreatorId: eventCreator?.id,
          metadata: {
            message: ActivityNotifyMessge[String(notifyInfo.type)]({
              activityName: activity.name,
              eventCreatorName: eventCreator?.name,
              startTime: activity.from,
            }),
            activityId: activity.id,
          },
          notificationFor: notifyForEnum.user,
        });
        const listDeviceToken = await this.usersRepository.deviceInfos(userId).find();
        const listToken = listDeviceToken
          .map(function (item) {
            return {
              deviceToken: item.deviceToken || '',
              language: item.language || LANGUAGES.EN,
            };
          })
          .filter((item) => item);
        const count = await this.notificationRepository.count({
          userId,
          read: false,
        });
        listToken.forEach((item) => {
          this.firebaseService.message
            .sendToDevice(
              item.deviceToken,
              {
                data: {
                  status: String(newNotification?.status),
                  notificationType: String(newNotification?.notificationType),
                  userId: String(newNotification?.userId),
                  eventCreatorId: String(newNotification?.eventCreatorId),
                  countNew: String(count.count),
                  id: String(newNotification?.id),
                  picture: image,
                  notificationFor: String(notifyForEnum.user),
                  postId: String(activity.postId),
                },
                notification: {
                  body: ActivityNotifyMessge[String(notifyInfo.type)]({
                    language: item.language,
                    activityName: activity.name,
                    eventCreatorName: eventCreator?.name,
                    startTime: activity.from,
                  }),
                  imageUrl: image,
                  image: image,
                  badge: String(count.count),
                  sound: 'bingbong.aiff',
                },
              },
              {
                contentAvailable: true,
                mutableContent: true,
              },
            )
            .then((result) => {})
            .catch((err) => {});
        });
      });
      await asyncLimiter(promise);
    } catch (e) {
      return handleError(e);
    }
  }
  async sendCloudNotificationToDeviceForPage({
    pageId,
    userId,
    notification,
  }: {
    pageId: number;
    userId: number;
    notification: Notification;
  }): Promise<void> {
    const page = await this.pageRepository.findById(pageId);
    const image = String(path(notification, ['eventCreator', 'profiles', 'avatars', 'mediaContent', 'url']));

    const listDeviceToken = await this.usersRepository.deviceInfos(userId).find();
    const listToken = listDeviceToken
      .map(function (item) {
        return {
          deviceToken: item.deviceToken || '',
          language: item.language || LANGUAGES.EN,
        };
      })
      .filter((item) => item);
    const count = await this.notificationRepository.count({
      userId,
      read: false,
    });
    listToken.forEach((item) => {
      const body = actionMessForPage[String(notification.notificationType)];
      this.firebaseService.message
        .sendToDevice(
          item.deviceToken,
          {
            data: {
              status: String(notification.status),
              notificationType: String(notification.notificationType),
              userId: String(notification.userId),
              eventCreatorId: String(notification.eventCreatorId),
              targetPostId: String(notification.targetPostId),
              countNew: String(count.count),
              notificationFor: String(notifyForEnum.page),
              pageId: String(pageId),
              id: String(notification.id),
              ...(notification.rankingId
                ? {
                    rankingId: String(notification.rankingId),
                  }
                : {}),
              ...(notification.replyRankingId
                ? {
                    replyRankingId: String(notification.replyRankingId),
                  }
                : {}),
              ...(notification.bookingId
                ? {
                    bookingId: String(notification.bookingId),
                  }
                : {}),
              picture: image,
            },
            notification: {
              body: body
                ? body(page.name, item.language)
                : item.language === LANGUAGES.VI
                ? 'Tin nhắn chưa đọc'
                : 'Missing message',
              imageUrl: image,
              image: image,
              badge: String(count.count),
              sound: 'bingbong.aiff',
            },
          },
          {
            contentAvailable: true,
            mutableContent: true,
          },
        )
        .then(() => {})
        .catch(() => {});
    });
  }

  async sendCloudNotificationToDeviceForUser({
    userId,
    notification,
    body,
  }: {
    userId: number;
    notification: Notification;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
  }): Promise<void> {
    const image = String(path(notification, ['eventCreator', 'profiles', 'avatars', 'mediaContent', 'url']));

    const listDeviceToken = await this.usersRepository.deviceInfos(userId).find();
    const listToken = listDeviceToken
      .map(function (item: AnyObject) {
        return {
          deviceToken: item.deviceToken || '',
          language: item.language || LANGUAGES.EN,
        };
      })
      .filter((item) => item);
    const count = await this.notificationRepository.count({
      userId,
      read: false,
    });
    listToken.forEach((item) => {
      this.firebaseService.message
        .sendToDevice(
          item.deviceToken,
          {
            data: {
              status: String(notification.status),
              notificationType: String(notification.notificationType),
              userId: String(notification.userId),
              eventCreatorId: String(notification.eventCreatorId),
              targetPostId: String(notification.targetPostId),
              countNew: String(count.count),
              notificationFor: String(notifyForEnum.user),
              id: String(notification.id),
              ...(notification.rankingId
                ? {
                    rankingId: String(notification.rankingId),
                  }
                : {}),
              ...(notification.replyRankingId
                ? {
                    replyRankingId: String(notification.replyRankingId),
                  }
                : {}),
              ...(notification.bookingId
                ? {
                    bookingId: String(notification.bookingId),
                  }
                : {}),
              picture: image,
            },
            notification: {
              body: body
                ? getMessagePage({...body, ...item.language})
                : handleGenerateNotifyBody(
                    item.language,
                    notification.notificationType || '',
                    notification.userId === path(notification, ['targetPost', 'creatorId']),
                    path(notification, ['eventCreator', 'name']) || '',
                    path(notification, ['targetPost', 'creator', 'name']) || '',
                    path(notification, ['comment', 'content']) || '',
                    path(notification, ['childComment', 'content']) || '',
                    path(notification, ['ranking']) || {},
                    path(notification, ['replyRanking', 'content']) || '',
                  ),
              imageUrl: image,
              image: image,
              badge: String(count.count),
              sound: 'bingbong.aiff',
            },
          },
          {
            contentAvailable: true,
            mutableContent: true,
          },
        )
        .then(() => {})
        .catch(() => {});
    });
  }
}
