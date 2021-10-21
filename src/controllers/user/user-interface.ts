import {UsersWithRelations} from '../../models';

export interface CredentialsInterface {
  email: string;
  password: string;
  deviceToken?: string;
  language?: string;
  macAddress?: string;
  ipAddress?: string;
  brand?: string;
  model?: string;
  systemVersion?: string;
}

export interface RegisterRequestInterface {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  userTypeAccess?: string;
}

export interface RegisterRequestFacebookInterface {
  name: string;
  username: string;
  email: string;
  birthday?: string;
  gender?: string;
  avatar?: string;
  userTypeAccess?: string;
  identityApple?: string;
}

export interface RequestLoginFacebokInterface {
  email?: string;
  token: string;
  name: string;
  id: string;
  picture: {
    data: {
      url: string;
    };
  };
  deviceToken: string;
  language?: string;
  macAddress?: string;
  ipAddress?: string;
  brand?: string;
  model?: string;
  systemVersion?: string;
}

export interface RequestLoginAppleInterface {
  authorizationCode: string;
  email: string;
  familyName: string;
  givenName: string;
  identityToken: string;
  deviceToken: string;
  language?: string;
  macAddress?: string;
  ipAddress?: string;
  brand?: string;
  model?: string;
  systemVersion?: string;
}

export interface RequestLogoutInterface {
  deviceToken: string;
}

export interface ResetPasswordInterface {
  email: string;
  code: string;
  password: string;
}

export interface AddPasswordRequestInterface {
  userId: number;
  password: string;
}

export interface UserWithRelatedPageId extends Partial<UsersWithRelations> {
  relatedPageId?: number;
}

export interface UserWithTotalPost extends Partial<UsersWithRelations> {
  totalPost?: number;
}

export interface UserWithRecommend extends Partial<UsersWithRelations> {
  followed?: boolean;
}
