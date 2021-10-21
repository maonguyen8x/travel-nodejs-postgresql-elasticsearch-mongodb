import {PostsWithRelations} from '../../models';

export enum PostTypeEnum {
  service = 'SERVICE',
}

export interface PostDataWithFlagInterface extends Partial<PostsWithRelations> {
  isSavedLocation?: boolean;
  rated?: boolean;
  marked?: boolean;
  liked?: boolean;
  participantCount?: number;
  joined?: boolean;
}
