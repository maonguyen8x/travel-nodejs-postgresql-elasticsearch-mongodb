import {Activity, ActivityParticipant, Currency, Locations, MediaContents, UsersWithRelations} from '../../models';
import {PostDataWithFlagInterface} from '../posts/post.contant';

export enum ActivityStatusEnum {
  draft = 'DRAFT',
  public = 'PUBLIC',
}

export interface CreateActivityRequestInterface extends Partial<Activity> {
  location?: Partial<Locations>;
  introduction: string;
  mediaContents: MediaContents[];
  showOnProfile?: boolean;
}

export interface ActivityDetailResponseInterface extends Partial<Activity> {
  location?: Partial<Locations>;
  introduction?: string;
  mediaContents?: MediaContents[];
  post?: Partial<PostDataWithFlagInterface> | null;
  currency?: Currency;
  participantCount?: number;
  joined?: boolean;
  showOnProfile?: boolean;
}

export interface ActivityParticipantResponseInterface extends Partial<ActivityParticipant> {
  user?: ActivityParticipantUserInterface;
}

export interface ActivityParticipantUserInterface extends Partial<UsersWithRelations> {
  followed?: boolean;
  followStatus?: string;
}

export enum participantStatusEnum {
  uninvited = 'UNINVITED',
  invited = 'INVITED',
  join = 'JOIN',
  remove = 'REMOVE',
}
