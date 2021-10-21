import {belongsTo, Entity, hasOne, model, property} from '@loopback/repository';
import moment from 'moment';
import {Avatars} from './avatars.model';
import {Backgrounds} from './backgrounds.model';
import {UserAddress} from './user-address.model';
import {UserBirthday} from './user-birthday.model';
import {UserGender} from './user-gender.model';
import {UserIntroduce} from './user-introduce.model';
import {UserPhone} from './user-phone.model';
import {UserWebsite} from './user-website.model';
import {UserWork} from './user-work.model';
import {Users} from './users.model';
import {USER_PROFILE_BIO_DEFAULT} from '../configs/user-constants';

@model()
export class Profiles extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  education?: string;

  @property({
    type: 'string',
    default: USER_PROFILE_BIO_DEFAULT,
  })
  bio?: string;

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

  @belongsTo(() => Users)
  userId: number;

  @hasOne(() => Avatars, {keyTo: 'profileId'})
  avatars: Avatars;

  @hasOne(() => Backgrounds, {keyTo: 'profileId'})
  backgrounds: Backgrounds;

  @hasOne(() => UserBirthday, {keyTo: 'profileId'})
  birthday: UserBirthday;

  @hasOne(() => UserGender, {keyTo: 'profileId'})
  gender: UserGender;

  @hasOne(() => UserAddress, {keyTo: 'profileId'})
  address: UserAddress;

  @hasOne(() => UserIntroduce, {keyTo: 'profileId'})
  introduce: UserIntroduce;

  @hasOne(() => UserWork, {keyTo: 'profileId'})
  work: UserWork;

  @hasOne(() => UserWebsite, {keyTo: 'profileId'})
  website: UserWebsite;

  @hasOne(() => UserPhone, {keyTo: 'profileId'})
  phone: UserPhone;

  constructor(data?: Partial<Profiles>) {
    super(data);
  }
}

export interface ProfilesRelations {
  // describe navigational properties here
}

export type ProfilesWithRelations = Profiles & ProfilesRelations;
