import {ServiceReview} from '../../models';

export interface ServiceReviewPost extends Pick<ServiceReview, 'point' | 'serviceId' | 'bookingId'> {
  content: string;
  mediaContentIds: number[];
}

export interface ServiceReviewPatch extends Pick<ServiceReview, 'point'> {
  content: string;
  mediaContentIds: number[];
}
