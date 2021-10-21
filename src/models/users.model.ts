import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import moment from 'moment';
import {Bookmark} from './bookmark.model';
import {ChildComment} from './child-comment.model';
import {Comments} from './comments.model';
import {Follow} from './follow.model';
import {Interesting} from './interesting.model';
import {Likes} from './likes.model';
import {MediaContents} from './media-contents.model';
import {MyLocations} from './my-locations.model';
import {Posts} from './posts.model';
import {Profiles} from './profiles.model';
import {Rankings} from './rankings.model';
import {Shares} from './shares.model';
import {UserEmail} from './user-email.model';
import {Usercredentials} from './usercredentials.model';
import {Notification} from './notification.model';
import {DeviceToken} from './device-token.model';
import {Plan} from './plan.model';
import {UsersBlock} from './users.block.model';
import {Page} from './page.model';
import {userAccessType} from '../configs/user-constants';

@model()
export class Users extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50,
    index: {
      unique: true,
    },
  })
  username: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isActive?: boolean;

  @property({
    type: 'string',
    jsonSchema: {
      enum: userAccessType,
    },
    default: 'NORMAL',
  })
  userTypeAccess?: string;

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

  @property({
    type: 'date',
  })
  deletedAt?: string | null;

  @property({
    type: 'string',
  })
  blockMessage?: string | null;

  @property({
    type: 'date',
  })
  blockedAt?: string | null;

  @property({
    type: 'number',
    default: 0,
  })
  totalFollowing?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalFollower?: number;

  @property({
    type: 'string',
  })
  roles: string;

  @property({
    type: 'string',
  })
  scopes?: string;

  @hasOne(() => Usercredentials)
  usercredentials: Usercredentials;

  @hasMany(() => Likes, {keyTo: 'userId'})
  likes: Likes[];

  @hasMany(() => Posts, {keyTo: 'creatorId'})
  posts: Posts[];

  @hasMany(() => Rankings, {keyTo: 'userId'})
  rankings: Rankings[];

  @hasMany(() => Shares, {keyTo: 'userId'})
  shares: Shares[];

  @hasOne(() => Profiles, {keyTo: 'userId'})
  profiles: Profiles;

  @hasMany(() => MediaContents, {keyTo: 'userId'})
  mediaContents: MediaContents[];

  @hasMany(() => Comments, {keyTo: 'userId'})
  comments: Comments[];

  @hasOne(() => UserEmail, {keyTo: 'userId'})
  email: UserEmail;

  @hasOne(() => Interesting, {keyTo: 'userId'})
  interesting: Interesting;

  @hasMany(() => Interesting, {keyTo: 'userId'})
  interestings: Interesting[];

  @hasMany(() => ChildComment, {keyTo: 'userId'})
  childComments: ChildComment[];

  @hasMany(() => Bookmark, {keyTo: 'userId'})
  bookmarks: Bookmark[];

  @hasMany(() => Follow, {keyTo: 'userId'})
  follows: Follow[];

  @hasMany(() => Follow, {keyTo: 'followingId'})
  following: Follow[];

  @hasMany(() => MyLocations, {keyTo: 'userId'})
  myLocations: MyLocations[];

  @hasMany(() => Notification, {keyTo: 'userId'})
  notifications: Notification[];

  @hasMany(() => DeviceToken, {keyTo: 'userId'})
  deviceInfos: DeviceToken[];

  @hasMany(() => Plan, {keyTo: 'userId'})
  plans: Plan[];

  @hasMany(() => UsersBlock, {keyTo: 'creatorId'})
  creator: UsersBlock[];

  @hasMany(() => UsersBlock, {keyTo: 'userId'})
  user: UsersBlock[];

  @hasOne(() => Page, {keyTo: 'relatedUserId'})
  page: Page;

  constructor(data?: Partial<Users>) {
    super(data);
  }
}

export interface UsersRelations {
  // describe navigational properties here
}

export type UsersWithRelations = Users & UsersRelations;
