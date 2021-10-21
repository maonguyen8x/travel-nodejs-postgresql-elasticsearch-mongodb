import {HttpErrors} from '@loopback/rest';
import isemail from 'isemail';
import {Credentials} from '../repositories';
import {AnyObject} from '@loopback/repository';
import {ErrorCode} from '../constants/error.constant';
export function validateCredentials(credentials: Credentials) {
  // Validate Email
  if (!isemail.validate(credentials.email)) {
    throw new HttpErrors.UnprocessableEntity(ErrorCode.INVALID_EMAIL);
  }

  // Validate Password Length
  if (!credentials.password || credentials.password.length < 8) {
    throw new HttpErrors.UnprocessableEntity(ErrorCode.MINIMUM_8_CHARACTERS);
  }
}

export function validateLocation(location: AnyObject) {
  if (!location.name) {
    throw new HttpErrors.BadRequest(ErrorCode.INVALID_LOCATION_NAME);
  }
  if (!location.coordinates) {
    throw new HttpErrors.BadRequest(ErrorCode.INVALID_COORDINATES);
  }
  if (!location.locationType) {
    throw new HttpErrors.BadRequest(ErrorCode.INVALID_LOCATION_TYPE);
  }
}
