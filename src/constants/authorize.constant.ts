import {USER_ROLE_ADMIN, USER_ROLE_MODERATOR, USER_ROLE_NORMAL_USER} from '../configs/user-constants';
import {basicAuthorization} from '../services/basic.authorizor';

const CUSTOMER_ROLES = [USER_ROLE_NORMAL_USER, USER_ROLE_MODERATOR, USER_ROLE_ADMIN];

export const AUTHORIZE_CUSTOMER = {
  allowedRoles: CUSTOMER_ROLES,
  voters: [basicAuthorization],
};

export const AUTHORIZE_RULE = AUTHORIZE_CUSTOMER;
