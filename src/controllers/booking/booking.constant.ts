import {nanoid, customAlphabet} from 'nanoid';
import * as Joi from 'joi';

export enum BookingTypeEnum {
  tour = 'TOUR',
  stay = 'STAY',
}

export enum RoleTypeEnum {
  system = 'SYSTEM',
  page = 'PAGE',
  user = 'USER',
}

export enum BookingStatusEnum {
  request = 'REQUEST',
  confirmed = 'CONFIRMED',
  canceled = 'CANCELED',
  completed = 'COMPLETED',
}

export enum PayMethodEnum {
  postpaid = 'POSTPAID',
}

export const nanoCode = (): string => {
  const str1 = customAlphabet(nanoid().replace('-', '').replace('_', ''), 5)().toUpperCase();
  const str2 = customAlphabet(nanoid().replace('-', '').replace('_', ''), 5)().toUpperCase();
  return `${str1}-${str2}`;
};

const schemaUserInfoBooking = () =>
  Joi.object({
    name: Joi.string().required(),
    nationality: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
  });

export const schemaStayBooking = Joi.object({
  price: Joi.number().min(0).required(),
  numAdult: Joi.number().min(1).integer().required(),
  numChildren: Joi.number().min(0).integer().required(),
  numInfant: Joi.number().min(0).integer().required(),
  note: Joi.string().allow(null).allow('').optional(),
  expectedCheckinTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  userInfo: schemaUserInfoBooking().required(),
  otherUserInfo: schemaUserInfoBooking().optional(),
  serviceId: Joi.number().min(1).integer().required(),
  payMethod: Joi.string().valid(PayMethodEnum.postpaid),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  purposeTrip: Joi.string().optional(),
});

export const HOURS_CANCEL_BOOKING_TOUR = 3;
