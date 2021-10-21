import {
  MediaContents,
  Page,
  Posts,
  PageRelations,
  Service,
  ServiceRelations,
  PostsRelations,
  Rankings,
  Users,
  DestinationObject,
  TotalTourTimeObject,
} from '../../models';
import {PostDataWithFlagInterface} from '../posts/post.contant';

export interface FindPageNewsInterface extends Posts {
  liked?: boolean;
  marked?: boolean;
  page?: PageCovertForPostInterface;
}

export interface MediaContentInterface extends MediaContents {}

export interface PageCovertForPostInterface extends Page, PageRelations {
  profiles?: {
    avatars: {
      mediaContents: MediaContentInterface;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface FindPageServiceFoodInterface extends Service, ServiceRelations {
  attachments?: MediaContents[];
  content?: string;
  post?: PostDataWithFlagInterface;
}

export interface PageReviewResponseInterface extends Posts, PostsRelations {
  marked?: boolean;
  rated?: boolean;
  ranking?: Rankings;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface FindPageServiceTourResponseInterface extends Service, ServiceRelations {
  liked?: boolean;
  marked?: boolean;
  rated?: boolean;
  averagePoint?: number;
  post?: Posts;
  tour?: TourInfoServiceTourResponseInterface;
  attachments?: MediaContents[];
  content?: string;
  ranking?: Rankings | null;
  locationId?: number;
  totalRanking?: number;
  isSavedLocation?: boolean;
}

export interface TourInfoServiceTourResponseInterface {
  destinations?: DestinationObject[];
  vehicleServices?: string[];
  totalTourTime?: TotalTourTimeObject;
}

export interface UserPage extends Partial<Users> {
  avatarId?: number;
  backgroundId?: number;
}
