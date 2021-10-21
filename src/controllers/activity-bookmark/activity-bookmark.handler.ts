import {Filter, repository, Where} from '@loopback/repository';
import {ActivityBookmarkRepository} from '../../repositories';
import {ActivityBookmark} from '../../models';
import {handleError} from '../../utils/handleError';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '../../constants/error.constant';
import {ActivityBookmarkDetail} from './activity-bookmark.constant';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {ActivityHandler} from '../activities/activity.handler';
import {asyncLimiter} from '../../utils/Async-limiter';

export class ActivityBookmarkHandler {
  constructor(
    @repository(ActivityBookmarkRepository)
    public activityBookmarkRepository: ActivityBookmarkRepository,
    @inject(HandlerBindingKeys.ACTIVITIES_HANDLER)
    public activityHandler: ActivityHandler,
  ) {}

  async create({activityId, userId}: {activityId: number; userId: number}): Promise<ActivityBookmark> {
    return this.activityBookmarkRepository.create({
      activityId,
      userId,
    });
  }

  async deleteById({
    bookmarkId,
    userId,
  }: {
    bookmarkId: number;
    userId: number;
  }): Promise<{
    message: string;
  }> {
    try {
      const currentBookmark = await this.activityBookmarkRepository.findById(bookmarkId);
      if (currentBookmark && currentBookmark.userId === userId) {
        await this.activityBookmarkRepository.deleteById(bookmarkId);
        return {
          message: 'Detete bookmark activity successful',
        };
      } else {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async find({
    filter,
    userId,
  }: {
    filter?: Filter<ActivityBookmark>;
    userId: number;
  }): Promise<{
    data: ActivityBookmarkDetail[];
    count: number;
  }> {
    const where: Where<ActivityBookmark> = {
      ...filter?.where,
      userId,
    };
    const result = await this.activityBookmarkRepository.find({
      ...filter,
      where,
    });
    const count = (await this.activityBookmarkRepository.count(where)).count;
    const data = await asyncLimiter(
      result.map((item) =>
        this.converActivityBookmark({
          data: item,
          userId,
        }),
      ),
    );
    return {
      count,
      data,
    };
  }

  async converActivityBookmark({
    data,
    userId,
  }: {
    data: ActivityBookmark;
    userId: number;
  }): Promise<ActivityBookmarkDetail> {
    const activity = await this.activityHandler.findById({
      id: data.activityId,
      userId,
    });
    return {
      ...data,
      activity,
    };
  }
}
