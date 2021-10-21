import {inject} from '@loopback/context';
import {AnyObject, Filter, repository, Where} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {calculatePrice} from '@uto-tech/uto-types/dist/common/stay';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import _, {get, omit} from 'lodash';
import moment from 'moment';
import {NotificationLogicController} from '..';
import {bookingNotifyType} from '../../configs/notification-constants';
import {USER_TYPE_ACCESS_PAGE} from '../../configs/user-constants';
import {ErrorCode} from '../../constants/error.constant';
import {
  Booking,
  BookingRelations,
  Stay,
  StayReservation,
  StaySpecialDayPrice,
  Tour,
  TourRelations,
  TourReservation,
} from '../../models';
import {
  BookingRepository,
  MediaContentsRepository,
  ServiceRepository,
  StayRepository,
  StayReservationRepository,
  StaySpecialDayPriceRepository,
  TourRepository,
  TourReservationRepository,
  UsersRepository,
} from '../../repositories';
import {EmailService} from '../../services';
import {handleError} from '../../utils/handleError';
import {PageBookingTypeEnum} from '../pages/page.constant';
import {
  BookingStatusEnum,
  BookingTypeEnum,
  HOURS_CANCEL_BOOKING_TOUR,
  nanoCode,
  RoleTypeEnum,
  schemaStayBooking,
} from './booking.constant';
import {BookingStayInput, BookingTourInput} from './booking.interface';

dayjs.extend(utc);

export class BookingHandler {
  constructor(
    @repository(BookingRepository) public bookingRepository: BookingRepository,
    @repository(TourReservationRepository)
    public tourReservationRepository: TourReservationRepository,
    @repository(TourRepository) public tourRepository: TourRepository,
    @repository(ServiceRepository) public serviceRepository: ServiceRepository,
    @repository(UsersRepository) public usersRepository: UsersRepository,
    @repository(StayRepository) public stayRepository: StayRepository,
    @repository(StayReservationRepository)
    public stayReservationRepository: StayReservationRepository,
    @repository(StaySpecialDayPriceRepository)
    public staySpecialDayPriceRepository: StaySpecialDayPriceRepository,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,

    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @inject('emailService')
    public emailSv: EmailService,
  ) {}

  async createBookingTour(data: BookingTourInput, userId: number): Promise<Booking> {
    try {
      const serviceId = data.serviceId;
      const tour = await this.tourRepository.findOne({
        where: {serviceId},
        include: [
          {
            relation: 'timeToOrganizeTours',
            scope: {
              where: {
                startDate: {gt: moment().utc().toISOString()},
              },
            },
          },
          {
            relation: 'service',
          },
        ],
      });

      if (!tour) {
        throw new HttpErrors.NotFound(ErrorCode.OBJECT_NOT_FOUND);
      }

      const booking = await this.bookingRepository.create({
        type: BookingTypeEnum.tour,
        payMethod: data.payMethod,
        totalPrice: data.price,
        status: BookingStatusEnum.request,
        bookingCode: nanoCode(),
        currencyId: data.currencyId,
        createdById: userId,
        pageId: tour.service.pageId,
        serviceId: tour.serviceId,
        actById: userId,
      });

      data.bookingId = booking.id;
      if (tour.isDailyTour) await this.createDailyTourReservation(data, {tour});
      else await this.createUnDailyTourReservation(data, {tour});
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotifyBookingPage({
        bookingId: booking?.id,
        type: BookingTypeEnum.tour,
        notificationType: bookingNotifyType[String(booking.status)](BookingTypeEnum.tour),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleSendEmail(booking?.id);
      return booking;
    } catch (error) {
      return handleError(error);
    }
  }

  async createBookingStay(
    bookingStayInput: BookingStayInput,
    {currentUser}: {currentUser: UserProfile},
  ): Promise<Booking> {
    try {
      const data = await this.validateBookingStayRequest(bookingStayInput, {
        currentUser,
      });

      const userId = parseInt(currentUser[securityId]);
      const serviceId = data.serviceId;

      const booking = await this.bookingRepository.create({
        type: BookingTypeEnum.stay,
        payMethod: data.payMethod,
        totalPrice: data.price,
        status:
          data.pageBookingType === PageBookingTypeEnum.quickBooking
            ? BookingStatusEnum.confirmed
            : BookingStatusEnum.request,
        bookingCode: nanoCode(),
        currencyId: data.currencyId,
        createdById: userId,
        pageId: data.pageId,
        serviceId: serviceId,
        actById: userId,
      });

      const stayReservationData: Partial<StayReservation> = {
        ...omit(data, ['payMethod', 'serviceId', 'pageBookingType', 'pageId']),
        bookingId: booking.id,
        reservationCode: nanoCode(),
      };

      await this.stayReservationRepository.create(stayReservationData);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotifyBookingPage({
        bookingId: booking?.id,
        type: booking.type,
        notificationType: bookingNotifyType[String(booking.status)](BookingTypeEnum.stay),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleSendEmail(booking?.id);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleUpdateBookingStay(serviceId);
      return booking;
    } catch (error) {
      return handleError(error);
    }
  }

  getEndDayDailyTour(data: BookingTourInput, {tour}: {tour: Tour & TourRelations}): string | undefined {
    const startDate = data.startDate;
    const programs = tour.programs || [];
    const programsLength = programs.length;
    if (programsLength) {
      const lastPrograms = programs[programsLength - 1];
      const scheduleDay = lastPrograms.scheduleDay;
      const lastScheduleDay = scheduleDay[scheduleDay.length - 1];
      const timeTitle = moment(lastScheduleDay.timeTitle).utc();
      const hour = timeTitle.hour();
      const minute = timeTitle.minutes();

      return moment(startDate)
        .utc()
        .add(programsLength - 1, 'day')
        .set({hour, minute})
        .toISOString();
    }

    return startDate;
  }

  async createDailyTourReservation(
    data: BookingTourInput,
    {tour}: {tour: Tour & TourRelations},
  ): Promise<TourReservation> {
    try {
      const dateOffs = (tour.dateOff || []).map((item) => item.value);

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < dateOffs.length; i++) {
        const dateOff = dateOffs[i];
        const momentStartDate = moment(data.startDate).utc().startOf('day');
        const momentHoliday = moment(dateOff).utc().startOf('day');
        if (!momentStartDate.diff(momentHoliday, 'day')) {
          throw new HttpErrors.BadRequest(ErrorCode.START_DATE_IS_DATEOFF);
        }
      }

      if (!data.startDate) {
        return handleError(new HttpErrors.BadRequest(ErrorCode.START_DATE_IS_REQUIRED));
      }

      const tourReservationData: Partial<TourReservation> = {
        ...omit(data, ['payMethod', 'reservationCode', 'userId', 'currencyid', 'serviceId']),
        tourId: tour.id,
        reservationCode: nanoCode(),
        startDate: data.startDate,
        endDate: this.getEndDayDailyTour(data, {tour}),
        metadata: {
          id: tour.serviceId,
          name: tour.service?.name,
          totalTourTime: tour.totalTourTime,
          normalAdultPrice: tour.normalAdultPrice,
          normalChildPrice: tour.normalChildPrice,
          holidayAdultPrice: tour.holidayAdultPrice,
          holidayChildPrice: tour.holidayChildPrice,
          holidays: tour.holidays?.map((item) => item.value),
        },
      };

      return await this.tourReservationRepository.create(tourReservationData);
    } catch (error) {
      return handleError(error);
    }
  }

  async createUnDailyTourReservation(
    data: BookingTourInput,
    {tour}: {tour: Tour & TourRelations},
  ): Promise<TourReservation> {
    try {
      const timeOrganizeId = data.timeOrganizeId || 0;
      const timeToOrganizeTours = tour.timeToOrganizeTours || [];
      const timeOrganize = timeToOrganizeTours.find((item) => item.id === timeOrganizeId);

      if (!timeOrganize) {
        throw new HttpErrors.BadRequest(ErrorCode.BAD_REQUEST);
      }

      const tourReservationData: Partial<TourReservation> = {
        ...omit(data, ['payMethod', 'reservationCode', 'userId', 'currencyid', 'serviceId', 'timeOrganizeId']),
        tourId: tour.id,
        reservationCode: nanoCode(),
        startDate: timeOrganize.startDate,
        endDate: timeOrganize.endDate,
        metadata: {
          id: tour.serviceId,
          name: tour.service?.name,
          totalTourTime: tour.totalTourTime,
          normalAdultPrice: tour.normalAdultPrice,
          normalChildPrice: tour.normalChildPrice,
          holidayAdultPrice: tour.holidayAdultPrice,
          holidayChildPrice: tour.holidayChildPrice,
          holidays: tour.holidays?.map((item) => item.value),
          timeOrganize: {
            id: timeOrganize.id,
            startDate: timeOrganize.startDate,
            endDate: timeOrganize.endDate,
            tourType: timeOrganize.tourType,
          },
        },
      };

      return await this.tourReservationRepository.create(tourReservationData);
    } catch (error) {
      return handleError(error);
    }
  }

  async findById(id: number): Promise<Booking & BookingRelations> {
    try {
      const data = await this.bookingRepository.findById(id, {
        include: [
          {
            relation: 'serviceReviewItem',
            scope: {
              include: [
                {
                  relation: 'post',
                },
              ],
            },
          },
          {
            relation: 'service',
            scope: {
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
                {
                  relation: 'page',
                  scope: {
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'tourReservation',
            scope: {
              include: [
                {
                  relation: 'tour',
                },
              ],
            },
          },
          {
            relation: 'stayReservation',
            scope: {
              include: [
                {
                  relation: 'stay',
                  scope: {
                    include: [
                      {
                        relation: 'accommodationType',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'createdBy',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  relation: 'page',
                },
              ],
            },
          },
          {
            relation: 'currency',
          },
        ],
      });

      const mediaContentIds = get(data, 'stayReservation.stay.mediaContentIds', []);
      const mediaContents =
        mediaContentIds?.length > 0
          ? await this.mediaContentsRepository.find({
              where: {id: {inq: mediaContentIds}},
            })
          : [];

      return {
        ...data,
        // @ts-ignore
        stayReservation: {
          ...data?.stayReservation,
          stay: {
            ...data?.stayReservation?.stay,
            mediaContents,
          },
        },
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findBookingStayById(id: number): Promise<Booking & BookingRelations> {
    try {
      const data = await this.bookingRepository.findById(id, {
        include: [
          {
            relation: 'serviceReviewItem',
            scope: {
              include: [
                {
                  relation: 'post',
                },
              ],
            },
          },
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'page',
                  scope: {
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'stayReservation',
            scope: {
              include: [
                {
                  relation: 'stay',
                  scope: {
                    include: [
                      {
                        relation: 'accommodationType',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'createdBy',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  relation: 'page',
                },
              ],
            },
          },
          {
            relation: 'currency',
          },
        ],
      });

      if (data.type !== BookingTypeEnum.stay) {
        throw new HttpErrors.NotFound(ErrorCode.BOOKING_STAY_NOT_FOUND);
      }

      const mediaContentIds = get(data, 'stayReservation.stay.mediaContentIds', []);
      const mediaContents =
        mediaContentIds?.length > 0
          ? await this.mediaContentsRepository.find({
              where: {id: {inq: mediaContentIds}},
            })
          : [];

      return {
        ...data,
        // @ts-ignore
        stayReservation: {
          ...data?.stayReservation,
          stay: {
            ...data?.stayReservation?.stay,
            mediaContents,
          },
        },
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async findBookingTourById(id: number): Promise<Booking & BookingRelations> {
    try {
      const data = await this.bookingRepository.findById(id, {
        include: [
          {
            relation: 'serviceReviewItem',
            scope: {
              include: [
                {
                  relation: 'post',
                },
              ],
            },
          },
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'page',
                  scope: {
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
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
                {
                  relation: 'currency',
                },
              ],
            },
          },
          {
            relation: 'tourReservation',
            scope: {
              include: [
                {
                  relation: 'tour',
                },
              ],
            },
          },
          {
            relation: 'createdBy',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  relation: 'page',
                },
              ],
            },
          },
          {
            relation: 'currency',
          },
        ],
      });

      if (data.type !== BookingTypeEnum.tour) {
        throw new HttpErrors.NotFound(ErrorCode.BOOKING_TOUR_NOT_FOUND);
      }

      return data;
    } catch (error) {
      return handleError(error);
    }
  }

  whereReservation({
    startDate,
    endDate,
    groupBy,
  }: {
    startDate?: string;
    endDate?: string;
    type?: BookingTypeEnum;
    groupBy: 'startDate' | 'endDate';
  }): Where<AnyObject> | undefined {
    if (!startDate && !endDate) return undefined;
    const whereReservation = {
      startDate:
        startDate && endDate
          ? {and: [{startDate: {gt: startDate}}, {startDate: {lt: endDate}}]}
          : startDate
          ? {startDate: {gt: startDate}}
          : {startDate: {lt: endDate}},
      endDate:
        startDate && endDate
          ? {and: [{endDate: {gt: startDate}}, {endDate: {lt: endDate}}]}
          : startDate
          ? {endDate: {gt: startDate}}
          : {endDate: {lt: endDate}},
    };

    return whereReservation[groupBy];
  }

  async findBooking(
    filter: Filter<Booking>,
    {
      currentUser,
      keyword,
      startDate,
      endDate,
      type,
      groupBy = 'startDate',
      accommodationTypeId,
      isCustomer,
    }: {
      currentUser: UserProfile;
      keyword?: string;
      startDate?: string;
      endDate?: string;
      type?: BookingTypeEnum;
      groupBy?: 'startDate' | 'endDate';
      accommodationTypeId?: number;
      isCustomer?: boolean;
    },
  ): Promise<{data: (Booking & BookingRelations)[]; count: number}> {
    try {
      // Tìm booking với loại phòng
      const serviceIds = accommodationTypeId
        ? (
            await this.stayRepository.find({
              where: {
                accommodationTypeId,
              },
            })
          ).map((item) => item.serviceId || 0)
        : false;

      // Tìm booking với tên phòng
      // Hiện tại tính năng này ở app không còn
      // const serviceIds2 = keyword
      //   ? (await this.serviceRepository.find({
      //     where:
      //     {
      //       name:
      //       {
      //         like: `%${keyword}%`
      //       },
      //       ...accommodationTypeId ? {
      //         accommodationTypeId
      //       } : {}
      //     }
      //   }))
      //     .map((item) => item.id || 0)
      //   : [];

      const whereReservation = this.whereReservation({
        startDate,
        endDate,
        groupBy,
      });

      const bookingIds = whereReservation
        ? type === BookingTypeEnum.tour
          ? (
              await this.tourReservationRepository.find({
                where: whereReservation,
              })
            ).map((item) => item.bookingId || 0)
          : (
              await this.stayReservationRepository.find({
                where: whereReservation,
              })
            ).map((item) => item.bookingId || 0)
        : false;

      const where = {
        ...(filter?.where && filter?.where),
        ...(serviceIds && {serviceId: {inq: serviceIds}}),
        ...(bookingIds && {id: {inq: bookingIds}}),
      };

      let whereFilter: Where<Booking> = where;
      if (!isCustomer) {
        const user = await this.usersRepository.findById(parseInt(currentUser[securityId]), {
          include: [
            {
              relation: 'page',
            },
          ],
        });

        whereFilter =
          user.userTypeAccess === USER_TYPE_ACCESS_PAGE
            ? {...where, pageId: user.page.id, type}
            : {...where, createdById: user.id, type};
      }

      const count = await this.bookingRepository.count(whereFilter);
      const data = await this.bookingRepository.find({
        ...filter,
        where: whereFilter,
        include: [
          {
            relation: 'serviceReviewItem',
            scope: {
              include: [
                {
                  relation: 'post',
                },
              ],
            },
          },
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'page',
                  scope: {
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
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
            },
          },
          {
            relation: 'tourReservation',
            scope: {
              include: [
                {
                  relation: 'tour',
                },
              ],
            },
          },
          {
            relation: 'stayReservation',
            scope: {
              include: [
                {
                  relation: 'stay',
                  scope: {
                    include: [
                      {
                        relation: 'accommodationType',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'currency',
          },
          {
            relation: 'createdBy',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  relation: 'page',
                },
              ],
            },
          },
        ],
      });

      const result = !isCustomer
        ? await Promise.all(
            data.map(async (booking) => {
              const stay: Stay = _.get(booking, 'stayReservation.stay');
              const mediaContentIds = stay?.mediaContentIds || [];

              const mediaContents = mediaContentIds.length
                ? await this.mediaContentsRepository.find({
                    where: {
                      id: {
                        inq: mediaContentIds,
                      },
                    },
                  })
                : [];

              return {
                ...booking,
                stayReservation: {
                  ...booking.stayReservation,
                  stay: {
                    ...stay,
                    mediaContents,
                  },
                },
              };
            }),
          )
        : data;

      // @ts-ignore
      return {data: result, count: count.count};
    } catch (error) {
      return handleError(error);
    }
  }

  async findBookingStay(
    filter: Filter<Booking>,
    {
      currentUser,
      keyword,
      startDate,
      endDate,
      groupBy = 'startDate',
      accommodationTypeId,
      isCustomer,
    }: {
      currentUser: UserProfile;
      keyword?: string;
      startDate?: string;
      endDate?: string;
      groupBy?: 'startDate' | 'endDate';
      accommodationTypeId?: number;
      isCustomer?: boolean;
    },
  ): Promise<{data: (Booking & BookingRelations)[]; count: number}> {
    try {
      const userId = parseInt(currentUser[securityId]);

      // Tìm booking với loại phòng
      const serviceIds = accommodationTypeId
        ? (
            await this.stayRepository.find({
              where: {
                accommodationTypeId,
              },
            })
          ).map((item) => item.serviceId || 0)
        : false;

      // Tìm booking với tên phòng
      // Hiện tại tính năng này ở app không còn
      // const serviceIds2 = keyword
      //   ? (await this.serviceRepository.find({
      //     where:
      //     {
      //       name:
      //       {
      //         like: `%${keyword}%`
      //       },
      //       ...accommodationTypeId ? {
      //         accommodationTypeId
      //       } : {}
      //     }
      //   }))
      //     .map((item) => item.id || 0)
      //   : [];

      const whereReservation = this.whereReservation({
        startDate,
        endDate,
        groupBy,
      });

      const bookingIds = whereReservation
        ? (await this.stayReservationRepository.find({where: whereReservation})).map((item) => item.bookingId || 0)
        : false;

      const where = {
        ...(filter?.where && filter?.where),
        ...(serviceIds && {serviceId: {inq: serviceIds}}),
        ...(bookingIds && {id: {inq: bookingIds}}),
      };

      let whereFilter: Where<Booking> = where;
      if (!isCustomer) {
        const user = await this.usersRepository.findById(userId, {
          include: [
            {
              relation: 'page',
            },
          ],
        });

        whereFilter =
          user.userTypeAccess === USER_TYPE_ACCESS_PAGE
            ? {...where, pageId: user.page.id, type: BookingTypeEnum.stay}
            : {...where, createdById: user.id, type: BookingTypeEnum.stay};
      }

      const count = await this.bookingRepository.count(whereFilter);
      const data = await this.bookingRepository.find({
        ...filter,
        where: whereFilter,
        include: [
          {
            relation: 'serviceReviewItem',
            scope: {
              include: [
                {
                  relation: 'post',
                },
              ],
            },
          },
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'page',
                  scope: {
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'stayReservation',
            scope: {
              include: [
                {
                  relation: 'stay',
                  scope: {
                    include: [
                      {
                        relation: 'accommodationType',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            relation: 'currency',
          },
          {
            relation: 'createdBy',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  relation: 'page',
                },
              ],
            },
          },
        ],
      });

      const result = !isCustomer
        ? await Promise.all(
            data.map(async (booking) => {
              const stay: Stay = _.get(booking, 'stayReservation.stay');
              const mediaContentIds = stay?.mediaContentIds || [];

              const mediaContents = mediaContentIds.length
                ? await this.mediaContentsRepository.find({
                    where: {
                      id: {
                        inq: mediaContentIds,
                      },
                    },
                  })
                : [];

              return {
                ...booking,
                stayReservation: {
                  ...booking.stayReservation,
                  stay: {
                    ...stay,
                    mediaContents,
                  },
                },
              };
            }),
          )
        : data;

      // @ts-ignore
      return {data: result, count: count.count};
    } catch (error) {
      return handleError(error);
    }
  }

  async findBookingTour(
    filter: Filter<Booking>,
    {
      currentUser,
      keyword,
      startDate,
      endDate,
      groupBy = 'startDate',
      isCustomer,
    }: {
      currentUser: UserProfile;
      keyword?: string;
      startDate?: string;
      endDate?: string;

      groupBy?: 'startDate' | 'endDate';
      accommodationTypeId?: number;
      isCustomer?: boolean;
    },
  ): Promise<{data: (Booking & BookingRelations)[]; count: number}> {
    try {
      const userId = parseInt(currentUser[securityId]);

      // Ở app không còn tính năng tìm kiếm booking theo tên tour
      // const serviceIds = keyword
      //   ? (await this.serviceRepository.find({
      //     where:
      //     {
      //       name:
      //       {
      //         like: `%${keyword}%`
      //       },
      //     }
      //   }))
      //     .map((item) => item.id || 0)
      //   : [];

      const whereReservation = this.whereReservation({
        startDate,
        endDate,
        groupBy,
      });

      const bookingIds = whereReservation
        ? (await this.tourReservationRepository.find({where: whereReservation})).map((item) => item.bookingId || 0)
        : false;

      const where = {
        ...(filter?.where && filter.where),
        ...(bookingIds && {id: {inq: bookingIds}}),
      };

      let whereFilter: Where<Booking> = where;
      if (!isCustomer) {
        const user = await this.usersRepository.findById(userId, {
          include: [
            {
              relation: 'page',
            },
          ],
        });

        whereFilter =
          user.userTypeAccess === USER_TYPE_ACCESS_PAGE
            ? {...where, pageId: user.page.id, type: BookingTypeEnum.tour}
            : {...where, createdById: user.id, type: BookingTypeEnum.tour};
      }

      const count = await this.bookingRepository.count(whereFilter);
      const data = await this.bookingRepository.find({
        ...filter,
        where: whereFilter,
        include: [
          {
            relation: 'serviceReviewItem',
            scope: {
              include: [
                {
                  relation: 'post',
                },
              ],
            },
          },
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'page',
                  scope: {
                    include: [
                      {
                        relation: 'location',
                      },
                    ],
                  },
                },
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
            },
          },
          {
            relation: 'tourReservation',
            scope: {
              include: [
                {
                  relation: 'tour',
                },
              ],
            },
          },
          {
            relation: 'currency',
          },
          {
            relation: 'createdBy',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  relation: 'page',
                },
              ],
            },
          },
        ],
      });

      const result = !isCustomer
        ? await Promise.all(
            data.map(async (booking) => {
              return {
                ...booking,
              };
            }),
          )
        : data;

      // @ts-ignore
      return {data: result, count: count.count};
    } catch (error) {
      return handleError(error);
    }
  }

  async validateStatusBooking(id: number, status: BookingStatusEnum, actionUser: UserProfile): Promise<void> {
    // eslint-disable-next-line no-useless-catch
    try {
      const userId = parseInt(actionUser[securityId]);
      const booking = await this.bookingRepository.findById(id, {
        include: [
          {
            relation: 'page',
          },
        ],
      });

      const relatedUserId = booking.page.relatedUserId;

      if (
        (status === BookingStatusEnum.confirmed || status === BookingStatusEnum.canceled) &&
        booking.status !== BookingStatusEnum.request
      ) {
        throw new HttpErrors.BadRequest(ErrorCode.INVALID_STATUS);
      }

      if (
        (status === BookingStatusEnum.confirmed && relatedUserId !== userId) ||
        (status === BookingStatusEnum.canceled && relatedUserId !== userId && booking.createdById !== userId)
      ) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }

      return;
    } catch (error) {
      throw error;
    }
  }

  async confirmBooking(id: number, currentUser: UserProfile): Promise<Booking & BookingRelations> {
    try {
      const userId = parseInt(currentUser[securityId]);
      await this.validateStatusBooking(id, BookingStatusEnum.confirmed, currentUser);

      await this.bookingRepository.updateById(id, {
        status: BookingStatusEnum.confirmed,
        actById: userId,
      });

      const booking = await this.bookingRepository.findById(id);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotifyBookingPage({
        bookingId: id,
        type: booking.type,
        notificationType: bookingNotifyType[String(BookingStatusEnum.confirmed)](booking.type),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleSendEmail(id);
      const result = await this.findById(id);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleUpdateBookingStay(result.serviceId);
      return result;
    } catch (error) {
      return handleError(error);
    }
  }

  async cancelBooking(
    id: number,
    currentUser: UserProfile,
    body: {reasonCancelation: string},
  ): Promise<Booking & BookingRelations> {
    try {
      const userId = parseInt(currentUser[securityId]);

      const user = await this.usersRepository.findById(userId);

      const cancelBy = user.userTypeAccess === USER_TYPE_ACCESS_PAGE ? RoleTypeEnum.page : RoleTypeEnum.user;

      await this.validateStatusBooking(id, BookingStatusEnum.canceled, currentUser);

      await this.bookingRepository.updateById(id, {
        cancelBy,
        status: BookingStatusEnum.canceled,
        actById: userId,
        reasonCancelation: body.reasonCancelation,
      });
      const booking = await this.bookingRepository.findById(id);
      // if (booking?.createdById && booking?.createdById !== booking?.actById) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotifyBookingPage({
        cancelBy,
        bookingId: id,
        type: booking.type,
        notificationType: bookingNotifyType[String(BookingStatusEnum.canceled)](booking.type, cancelBy),
      });
      // }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleSendEmail(booking?.id);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises

      if (booking.type === BookingTypeEnum.stay) {
        this.handleUpdateBookingStay(booking.serviceId);
      }

      if (booking.type === BookingTypeEnum.tour) {
        this.handleUpdateBookingTour(booking.serviceId);
      }

      return await this.findById(id);
    } catch (error) {
      return handleError(error);
    }
  }

  async completeTour(): Promise<void> {
    try {
      const currentTime = moment().utc().startOf('day').toISOString();
      const bookingIds = (
        await this.bookingRepository.find({
          fields: {id: true},
          where: {
            type: BookingTypeEnum.tour,
            status: BookingStatusEnum.confirmed,
          },
        })
      ).map((item) => item.id || 0);

      const filter: Filter<TourReservation> = {
        fields: {bookingId: true},
        where: {
          endDate: {lte: currentTime},
          bookingId: {inq: bookingIds},
        },
      };
      const targetTourReservations = await this.tourReservationRepository.find(filter);

      for (const item of targetTourReservations) {
        await this.bookingRepository.updateById(item.bookingId, {
          status: BookingStatusEnum.completed,
        });
        await this.handleSendEmail(item.bookingId);
        await this.notificationLogicController.createNotifyBookingPage({
          bookingId: item.bookingId,
          type: BookingTypeEnum.tour,
          notificationType: bookingNotifyType[String(BookingStatusEnum.completed)](BookingTypeEnum.tour),
        });
      }

      return;
    } catch (error) {
      return handleError(error);
    }
  }

  async completeStay(): Promise<void> {
    try {
      const currentTime = moment().utc().startOf('day').toISOString();
      const bookingIds = (
        await this.bookingRepository.find({
          fields: {id: true},
          where: {
            type: BookingTypeEnum.stay,
            status: BookingStatusEnum.confirmed,
          },
        })
      ).map((item) => item.id || 0);

      const filter: Filter<StayReservation> = {
        fields: {bookingId: true},
        where: {
          endDate: {lte: currentTime},
          bookingId: {inq: bookingIds},
        },
      };

      const targetStayReservations = await this.stayReservationRepository.find(filter);

      for (const item of targetStayReservations) {
        await this.bookingRepository.updateById(item.bookingId, {
          status: BookingStatusEnum.completed,
        });

        await this.handleSendEmail(item.bookingId);
        await this.notificationLogicController.createNotifyBookingPage({
          bookingId: item.bookingId,
          type: BookingTypeEnum.stay,
          notificationType: bookingNotifyType[String(BookingStatusEnum.completed)](BookingTypeEnum.stay),
        });
      }
    } catch (error) {
      return handleError(error);
    }
  }

  async autoCancelAllBookingTourRequesting({
    hours = HOURS_CANCEL_BOOKING_TOUR,
  }: {
    hours?: number;
  }): Promise<{length: number; status: string}> {
    try {
      const cancelMoment = moment().utc().subtract(hours, 'hour').toISOString();
      const bookingIds = (
        await this.bookingRepository.find({
          fields: {id: true},
          where: {
            type: BookingTypeEnum.tour,
            status: BookingStatusEnum.request,
            createdAt: {lte: cancelMoment},
          },
        })
      ).map((item) => item.id || 0);

      for (const bookingId of bookingIds) {
        await this.bookingRepository.updateById(bookingId, {
          status: BookingStatusEnum.canceled,
          cancelBy: RoleTypeEnum.system,
          reasonCancelation: 'System auto cancels booking',
        });

        const booking = await this.bookingRepository.findById(bookingId);

        this.notificationLogicController.createNotifyBookingPage({
          bookingId: bookingId,
          type: booking.type,
          cancelBy: RoleTypeEnum.system,
          notificationType: bookingNotifyType[String(BookingStatusEnum.canceled)](booking.type),
        });

        this.handleSendEmail(booking?.id);
        this.handleUpdateBookingTour(booking.serviceId);
      }

      return {
        status: 'success',
        length: bookingIds?.length,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async autoCancelAllBookingStayRequesting({
    hours = HOURS_CANCEL_BOOKING_TOUR,
  }: {
    hours?: number;
  }): Promise<{length: number; status: string}> {
    try {
      const cancelMoment = moment().utc().subtract(hours, 'hour').toISOString();
      const bookingIds = (
        await this.bookingRepository.find({
          fields: {id: true},
          where: {
            type: BookingTypeEnum.stay,
            status: BookingStatusEnum.request,
            createdAt: {lte: cancelMoment},
          },
        })
      ).map((item) => item.id || 0);

      for (const bookingId of bookingIds) {
        await this.bookingRepository.updateById(bookingId, {
          status: BookingStatusEnum.canceled,
          cancelBy: RoleTypeEnum.system,
          reasonCancelation: 'System auto cancels booking',
        });

        const booking = await this.bookingRepository.findById(bookingId);

        this.handleSendEmail(booking?.id);
        this.handleUpdateBookingStay(booking.serviceId);
      }

      return {
        status: 'success',
        length: bookingIds?.length,
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async handleSendEmail(bookingId?: number | null) {
    try {
      if (bookingId) {
        const isExit = await this.bookingRepository.exists(bookingId);
        if (!isExit) {
          return;
        }
        const booking = await this.bookingRepository.findById(bookingId, {
          include: [
            {
              relation: 'createdBy',
              scope: {
                include: [
                  {
                    relation: 'email',
                  },
                ],
              },
            },
            {
              relation: 'stayReservation',
            },
            {
              relation: 'page',
            },
          ],
        });
        const creatorEmail = get(booking, ['createdBy', 'email', 'email']);
        const otherUserEmail = get(booking, ['stayReservation', 'otherUserInfo', 'email']);
        const bookingType = get(booking, ['type']);

        const pageEmail = get(booking, ['page', 'email']);
        const cancelBy = get(booking, ['cancelBy']);
        // TODO: Confirm data for send to email (creatorUserId, actById, pageUserRelatedId)
        // const creatorUserId = get(booking, ['createdBy', 'id']);
        // const actById = get(booking, ['actById']);
        // const pageUserRelatedId = get(booking, ['page', 'relatedUserId']);

        const emailObject = {
          // [String(`${BookingStatusEnum.request}_${booking.type}`)]:
          //   (
          //     {
          //       type,
          //       email,
          //       pageName,
          //     }: {
          //       type?: string,
          //       email: string,
          //       pageName: string
          //     }
          //   ) => {
          //     if (type === 'page') {
          //       return {
          //         to: email,
          //         subject: 'jGooooo New booking request',
          //         html: `You have a new booking in ${pageName}`,
          //       }
          //     }
          //     return null
          //   },
          /**
           * send mail booking confirmed for user
           */
          // [String(`${BookingStatusEnum.confirmed}_${booking.type}`)]:
          //   (
          //     {
          //       type,
          //       email,
          //       pageName,
          //     }: {
          //       type?: string,
          //       email: string,
          //       pageName: string
          //     }
          //   ) => {
          //     if (type === 'page') {
          //       return {
          //         to: email,
          //         subject: 'jGooooo Booking confirmed',
          //         html: `You had confirmed a booking in ${pageName}`,
          //       }
          //     } return {
          //       to: email,
          //       subject: 'jGooooo Booking confirmed',
          //       html: `${pageName} had confirmed your booking`,
          //     }
          //   },
          // [String(`${BookingStatusEnum.canceled}_${booking.type}`)]:
          //   (
          //     {
          //       type,
          //       email,
          //       pageName,
          //     }: {
          //       type?: string,
          //       email: string,
          //       pageName: string
          //     }
          //   ) => {
          //     if (!actById) {
          //       if (type === 'page') {
          //         return {
          //           to: email,
          //           subject: `[${booking.bookingCode}] PARTNER - ` + 'jGooooo Cancel booking',
          //           html: `jGooooo had a cancel booking in ${pageName}`,
          //         }
          //       }
          //       if (type === 'user') {
          //         return {
          //           to: email,
          //           subject: `[${booking.bookingCode}] USER - ` + 'jGooooo Cancel booking',
          //           html: `jGooooo had canceled your booking`,
          //         }
          //       }
          //     }
          //     if (type === 'page') {
          //       return {
          //         to: email,
          //         subject: `[${booking.bookingCode}] PARTNER - ` + 'jGooooo Cancel booking',
          //         html: `You have a canceled booking in ${pageName}`,
          //       }
          //     }
          //     if (type === 'user' && actById === pageUserRelatedId) {
          //       return {
          //         to: email,
          //         subject: `[${booking.bookingCode}] USER - ` + 'jGooooo Cancel booking',
          //         html: `${pageName} had canceled your booking`,
          //       }
          //     }
          //     if (type === 'user' && actById === creatorUserId) {
          //       return {
          //         to: email,
          //         subject: `[${booking.bookingCode}] USER - ` + 'jGooooo Cancel booking',
          //         html: `You had canceled your booking`,
          //       }
          //     }
          //   },
          // [String(`${BookingStatusEnum.completed}_${booking.type}`)]:
          //   (
          //     {
          //       type,
          //       email,
          //       pageName,
          //     }: {
          //       type?: string,
          //       email: string,
          //       pageName: string
          //     }
          //   ) => {
          //     if (type === 'page') {
          //       return {
          //         to: email,
          //         subject: `Partner | B${booking.bookingCode}] PARTNER - ` + 'jGooooo Booking completed',
          //         html: `You have a booking completed in ${pageName}`,
          //       }
          //     } return {
          //       to: email,
          //       subject: `[${booking.bookingCode}] USER - ` + 'jGooooo Booking completed',
          //       html: `You have a booking completed`,
          //     }
          //   },

          /**
           * send mail normal
           */
          [String(`${BookingStatusEnum.request}`)]: ({
            type,
            email,
            pageName,
          }: {
            type?: string;
            email: string;
            pageName: string;
          }) => {
            if (type === 'page') {
              return {
                to: email,
                subject: `Partner | ${bookingType} Booking #${booking.bookingCode} - ` + 'New booking request',
                html: `You have a new booking in ${pageName}`,
              };
            }
            return null;
          },
          [String(`${BookingStatusEnum.canceled}`)]: ({
            type,
            email,
            pageName,
          }: {
            type?: string;
            email: string;
            pageName: string;
          }) => {
            // if (cancelBy === 'page') {
            //   return {
            //     to: email,
            //     subject: `[${booking.bookingCode}] PARTNER - ` + 'jGooooo Cancel booking',
            //     html: `jGooooo had a cancel booking in ${pageName}`,
            //   }
            // }
            // if (cancelBy === 'user') {
            //   return {
            //     to: email,
            //     subject: `[${booking.bookingCode}] USER - ` + 'jGooooo Cancel booking',
            //     html: `jGooooo had canceled your booking`,
            //   }
            // }
            if (cancelBy === RoleTypeEnum.user) {
              return {
                to: email,
                subject: `Partner | ${bookingType} Booking #${booking.bookingCode} - ` + 'User canceled booking',
                html: `You have a canceled booking in ${pageName}`,
              };
            }
            if (cancelBy === RoleTypeEnum.page) {
              return {
                to: email,
                subject: `Guest | ${bookingType} booking #${booking.bookingCode} - ` + `${pageName} canceled booking`,
                html: `${pageName} had canceled your booking`,
              };
            }
            if (cancelBy === RoleTypeEnum.system) {
              return {
                to: email,
                subject: `System | ${bookingType} booking #${booking.bookingCode} - ` + 'Auto cancel booking',
                html: `jGooooo auto cancels booking ${booking.bookingCode}`,
              };
            }
            // if (type === 'user' && actById === creatorUserId) {
            //   return {
            //     to: email,
            //     subject: `[${booking.bookingCode}] USER - ` + 'jGooooo Cancel booking',
            //     html: `${pageName} had canceled your booking`,
            //   }
            // }
          },

          [String(`${BookingStatusEnum.confirmed}`)]: ({
            type,
            email,
            pageName,
          }: {
            type?: string;
            email: string;
            pageName: string;
          }) => {
            if (type === 'page') {
              return {
                to: email,
                subject:
                  `Partner | ${bookingType} booking #${booking.bookingCode} - ` + `${pageName} Booking confirmed`,
                html: `You had confirmed a booking in ${pageName}`,
              };
            }
            return {
              to: email,
              subject: `Guest | ${bookingType} booking #${booking.bookingCode} - ` + `${pageName} Booking confirmed`,
              html: `${pageName} had confirmed your booking`,
            };
          },
          [String(`${BookingStatusEnum.completed}`)]: ({
            type,
            email,
            pageName,
          }: {
            type?: string;
            email: string;
            pageName: string;
          }) => {
            if (type === 'page') {
              return {
                to: email,
                subject: `Partner | ${bookingType} ${booking.bookingCode} - ` + 'Booking completed',
                html: `You have a booking completed in ${pageName}`,
              };
            }
            return {
              to: email,
              subject: `Guest | ${bookingType} booking ${booking.bookingCode} - ` + 'Booking completed',
              html: `You have a booking completed`,
            };
          },
        };
        /**
         * send email page
         */
        const pageParams = emailObject[String(`${booking.status}`)]({
          type: 'page',
          email: pageEmail || '',
          pageName: get(booking, ['page', 'name']) || '',
        });
        if (pageParams) {
          await this.emailSv.sendMail({
            ...pageParams,
            from: {
              name: '[DEV] jGooooo',
              address: 'dev.utotech@gmail.com',
            },
          });
        }

        const userParams = emailObject[String(`${booking.status}`)]({
          type: 'user',
          email: creatorEmail || '',
          pageName: get(booking, ['page', 'name']) || '',
        });
        if (userParams) {
          await this.emailSv.sendMail({
            ...userParams,
            from: {
              name: '[DEV] jGooooo',
              address: 'dev.utotech@gmail.com',
            },
          });
        }

        const otherUserParams = emailObject[String(`${booking.status}`)]({
          type: 'user',
          email: otherUserEmail || '',
          pageName: get(booking, ['page', 'name']) || '',
        });

        if (otherUserEmail && otherUserParams) {
          await this.emailSv.sendMail({
            ...otherUserParams,
            from: {
              name: '[DEV] jGooooo',
              address: 'dev.utotech@gmail.com',
            },
          });
        }
      }
    } catch (e) {
      return handleError(e);
    }
  }

  validatePriceBookingStay(
    data: BookingStayInput,
    stay: Stay,
    specialDayPrices: StaySpecialDayPrice[],
  ): {
    numOfNight: number;
    numOfNomalNight: number;
    numOfWeekendNight: number;
    totalPriceOfNomalNight: number;
    totalPriceOfWeekendNight: number;
    totalFeeIncreaseGuest: number;
    totalFeeIncreaseAdult: number;
    totalFeeIncreaseChild: number;
    totalFeeIncreaseInfant: number;
    numOfIncreaseAdult: number;
    numOfIncreaseChild: number;
    numOfIncreaseInfant: number;
    price: number;
    priceWeekend: number;
    totalPrice: number;
    totalDiscount: number;
    discountLongTermRental: number;
    discountEarlyBooking: number;
    discountLastHourBooking: number;
    specialDays: {date: string; price: number}[];
  } {
    const {
      numberOfAdult = 0,
      numberOfChild = 0,
      numberOfInfant = 0,
      maxNumberOfGuest = 0,
      maxGuestIncludeChildAndInfant = true,
      feeCleaning = 0,
      feeIncreaseAdult = 0,
      feeIncreaseChild = 0,
      feeIncreaseInfant = 0,
      priceWeekend = 0,
      price = 0,
      discountWeeklyRental = 0,
      discountMonthlyRental = 0,
      discountYearlyRental = 0,
      discountEarlyBooking = 0,
      discountEarlyBookingDay = 0,
      discountLastHourBooking = 0,
      numberOfStandardGuest = 0,
    } = stay;
    const {
      numAdult = 0,
      numChildren = 0,
      numInfant = 0,
      endDate = dayjs().utc().toISOString(),
      startDate = dayjs().utc().toISOString(),
    } = data;
    const error = new HttpErrors.BadRequest(ErrorCode.INVALID_NUMBER_OF_GUEST);

    if (numAdult + numChildren + numInfant > maxNumberOfGuest) throw error;
    if (numAdult > numberOfAdult || numChildren > numberOfChild || numInfant > numberOfInfant) throw error;
    const dataInput = {
      numAdult,
      numChildren,
      numInfant,
      startDate,
      endDate,
    };
    const stayInfo = {
      maxGuestIncludeChildAndInfant,
      feeCleaning,
      feeIncreaseAdult,
      feeIncreaseChild,
      feeIncreaseInfant,
      priceWeekend,
      price,
      discountWeeklyRental,
      discountMonthlyRental,
      discountYearlyRental,
      discountEarlyBooking,
      discountEarlyBookingDay,
      discountLastHourBooking,
      discountLastHourBookingTime: stay.discountLastHourBookingTime || '00:00',
      numberOfStandardGuest,
      specialDays: specialDayPrices.map((item) => ({
        date: item.date,
        price: item.price,
      })),
    };
    const metadata = calculatePrice(dataInput, stayInfo);

    return {
      ...metadata,
      specialDays: specialDayPrices.map((item) => ({
        date: item.date,
        price: item.price,
      })),
    };
  }

  async validateBookingStayRequest(
    data: BookingStayInput,
    {currentUser}: {currentUser: UserProfile},
  ): Promise<BookingStayInput> {
    // eslint-disable-next-line no-useless-catch
    try {
      const {error} = schemaStayBooking.validate(data);
      if (error) throw new HttpErrors.BadRequest(error.message);
      const serviceStay = await this.serviceRepository.findById(data.serviceId, {
        include: [
          {
            relation: 'page',
          },
          {
            relation: 'stay',
          },
          {
            relation: 'specialDayPrices',
          },
          {
            relation: 'offDays',
            scope: {
              where: {
                and: [
                  {
                    date: {
                      lte: dayjs.utc(data.startDate).startOf('day').toISOString(),
                    },
                  },
                  {
                    date: {
                      gt: dayjs.utc(data.endDate).startOf('day').toISOString(),
                    },
                  },
                ],
              },
            },
          },
        ],
      });
      const stay = serviceStay.stay;
      const page = serviceStay.page;
      if (!stay) throw new HttpErrors.NotFound(ErrorCode.SERVICE_NOT_FOUND);
      if (!page) throw new HttpErrors.NotFound(ErrorCode.PAGE_NOT_FOUND);

      const generalInformation = page.generalInformation;

      if (!generalInformation || !generalInformation.stay)
        throw new HttpErrors.NotFound(ErrorCode.OBJECT_NOT_FOUND + 'generalInformation');

      const bookingIds = (
        await this.bookingRepository.find({
          where: {
            status: {
              inq: [BookingStatusEnum.request, BookingStatusEnum.confirmed],
            },
            serviceId: data.serviceId,
          },
        })
      ).map((item) => item.id || 0);

      if (bookingIds.length) {
        const where = {
          and: [
            {
              bookingId: {inq: bookingIds},
            },
            {
              or: [
                {
                  and: [
                    {
                      startDate: {
                        gte: dayjs.utc(data.startDate).startOf('day').toISOString(),
                      },
                    },
                    {
                      startDate: {
                        lte: dayjs.utc(data.endDate).startOf('day').toISOString(),
                      },
                    },
                  ],
                },
                {
                  and: [
                    {
                      endDate: {
                        gte: dayjs.utc(data.startDate).startOf('day').toISOString(),
                      },
                    },
                    {
                      endDate: {
                        lte: dayjs.utc(data.endDate).startOf('day').toISOString(),
                      },
                    },
                  ],
                },
              ],
            },
          ],
        };

        const existedBookingStay = await this.stayReservationRepository.findOne({
          where,
        });

        if (existedBookingStay || (serviceStay.offDays && serviceStay.offDays.length)) {
          throw new HttpErrors.Conflict(ErrorCode.CONFLICT_OBJECT);
        }
      }

      const specialDayPrices = serviceStay.specialDayPrices || [];

      const metadata = this.validatePriceBookingStay(data, stay, specialDayPrices);

      return {
        ...data,
        metadata,
        currencyId: serviceStay.currencyId,
        pageId: page.id,
        pageBookingType:
          (generalInformation.stay?.bookingType as PageBookingTypeEnum) || PageBookingTypeEnum.confirmBooking,
        stayId: stay.id,
      };
    } catch (error) {
      throw error;
    }
  }

  async handleUpdateBookingStay(serviceId: number): Promise<void> {
    const booking = await this.bookingRepository.find({
      where: {
        serviceId,
        status: {
          inq: [BookingStatusEnum.confirmed, BookingStatusEnum.request],
        },
      },
      include: [
        {
          relation: 'stayReservation',
        },
      ],
    });
    await this.stayRepository.elasticService.updateById(
      {
        booking: booking.map((item) => {
          if (item.stayReservation) {
            return {
              startDate: item.stayReservation.startDate,
              endDate: item.stayReservation.endDate,
            };
          }
        }),
      },
      serviceId,
    );
  }

  async handleUpdateBookingTour(serviceId: number): Promise<void> {
    // const booking = await this.bookingRepository.find({
    //   where: {
    //     serviceId,
    //     status: {
    //       inq: [BookingStatusEnum.confirmed, BookingStatusEnum.request]
    //     }
    //   },
    //   include: [
    //     {
    //       relation: 'stayReservation'
    //     }
    //   ]
    // });
    // await this.stayRepository.elasticService.updateById({
    //   booking: booking.map(item => {
    //     if(item.stayReservation){
    //       return {
    //         startDate: item.stayReservation.startDate,
    //         endDate: item.stayReservation.endDate
    //       }
    //     }
    //   })
    // }, serviceId)
  }
}
