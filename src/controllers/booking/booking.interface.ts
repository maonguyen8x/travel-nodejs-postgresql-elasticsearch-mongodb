import {StayReservation, TourReservation} from '../../models';
import {PageBookingTypeEnum} from '../pages/page.constant';
import {BookingStatusEnum} from './booking.constant';

export interface BookingTourInput extends Partial<TourReservation> {
  payMethod: string;
  timeOrganizeId?: number;
  serviceId: number;
}

export interface BookingTourResponse extends BookingTourInput {
  status: BookingStatusEnum;
}

export interface BookingStayInput extends Partial<StayReservation> {
  payMethod: string;
  serviceId: number;
  currencyId?: number;
  pageBookingType?: PageBookingTypeEnum;
  pageId?: number;
}
