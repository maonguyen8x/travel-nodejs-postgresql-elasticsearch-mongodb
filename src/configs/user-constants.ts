export const USER_ROLE_ADMIN = 'admin';
export const USER_ROLE_MODERATOR = 'moderator';
export const USER_ROLE_NORMAL_USER = 'normal_user';
export const USER_ROLE_SUPPORT_USER = 'support';

export const USER_TYPE_ACCESS_NORMAL = 'NORMAL';
export const USER_TYPE_ACCESS_ADMIN = 'ADMIN';
export const USER_TYPE_ACCESS_FACEBOOK = 'FACEBOOK';
export const USER_TYPE_ACCESS_GOOGLE = 'GOOGLE';
export const USER_TYPE_ACCESS_APPLE = 'APPLE';
export const USER_TYPE_ACCESS_PAGE = 'PAGE';
export const USER_EMAIL_FACEBOOK_SUFFIX = '@facebook.com';
export const USER_EMAIL_GOOGLE_SUFFIX = '@google.com';
export const USER_PROFILE_BIO_DEFAULT = 'One of the proudest moment in a lifetime is the first step into unknown land.';

export const FB_API_URL = process.env.FB_API || 'https://graph.facebook.com/me';
export const APPLE_AUTHEN_API_URL = process.env.APPLE_AUTHEN_API_URL || 'https://appleid.apple.com/auth/keys';
export const FB_DEFAULT_PROPERTIES = ['id', 'email', 'first_name', 'last_name'];

export const USER_MESSAGE_SENT_VERIFY_CODE_SUCCESS = 'Verify code will send to your email please check.';
export const USER_MESSAGE_SENT_VERIFY_CODE_UPDATE_PASSWORD_SUCCESS =
  'Verify code for update password will send to your email please check.';
export const USER_MESSAGE_UPDATE_PASSWORD_SUCCESS = 'Update password successful.';
export const CURRENT_PASSWORD_INCORRECT = 'CURRENT_PASSWORD_INCORRECT';
export const USER_MESSAGE_UPDATE_PASSWORD_FAIL = 'UPDATE_PASSWORD_FAIL';
export const USER_MESSAGE_UPDATE_LANGUAGE_SUCCESS = 'Update language successful.';
export const ACCOUNT_HAD_PASSWORD = 'This account had password.';
export const ACCOUNT_HAD_NOT_PASSWORD_YET = 'This account had not password yet.';
export const LOG_OUT_SUCCESS = 'Logout successful.';
export const LOG_OUT_FAIL = 'Logout fail.';

export const USER_GENDER_UNSPECIFIED = 'UNSPECIFIED';
export const USER_GENDER_MALE = 'MALE';
export const USER_GENDER_FEMALE = 'FEMALE';

export const USER_GENDER_CONSTANTS = [USER_GENDER_UNSPECIFIED, USER_GENDER_MALE, USER_GENDER_FEMALE];

export const userAccessType = [
  USER_TYPE_ACCESS_ADMIN,
  USER_TYPE_ACCESS_NORMAL,
  USER_TYPE_ACCESS_FACEBOOK,
  USER_TYPE_ACCESS_GOOGLE,
  USER_TYPE_ACCESS_PAGE,
  USER_TYPE_ACCESS_APPLE,
];
