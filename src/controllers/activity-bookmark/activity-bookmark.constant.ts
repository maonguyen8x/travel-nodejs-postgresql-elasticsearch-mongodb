import {ActivityBookmarkWithRelations} from '../../models';
import {ActivityDetailResponseInterface} from '../activities/activity.constant';

export interface ActivityBookmarkDetail extends Partial<ActivityBookmarkWithRelations> {
  activity: ActivityDetailResponseInterface;
}
