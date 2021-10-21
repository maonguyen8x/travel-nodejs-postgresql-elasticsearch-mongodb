import {PageReview} from '../../models';

export interface PageReviewPost extends Pick<PageReview, 'point' | 'pageId'> {
  content: string;
  mediaContentIds: number[];
}

export interface PageReviewPatch extends Pick<PageReview, 'point'> {
  content: string;
  mediaContentIds: number[];
}
