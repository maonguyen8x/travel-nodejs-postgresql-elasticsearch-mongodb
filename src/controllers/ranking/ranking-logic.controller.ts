// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/context';

import {inject} from '@loopback/context';
import {AnyObject, repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {
  NOTIFICATION_TYPE_USER_RANKING_POST,
  NOTIFICATION_TYPE_USER_REPLY_RANKING,
} from '../../configs/notification-constants';
import {POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import {
  RANKING_ACCESS_TYPE_ACCEPTED,
  RANKING_ACCESS_TYPE_NOT_ACCEPTED,
  RANKING_TYPE_RANKING_LOCATION,
  RANKING_TYPE_RANKING_POST,
} from '../../configs/ranking-constant';
import {Rankings, ReplyRanking} from '../../models';
import {LocationsRepository, PostsRepository, RankingsRepository} from '../../repositories';
import {NotificationLogicController} from '..';
import {handleError} from '../../utils/handleError';
import {ErrorCode} from '../../constants/error.constant';
import {LocationTypesEnum} from '../../configs/location-constant';
import {convertPointRankingToPointScore} from '../../utils/common';

export class RankingLogicController {
  constructor(
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
  ) {}

  async create(ranking: Partial<Rankings>): Promise<Rankings> {
    try {
      const check = await this.rankingsRepository.find({
        where: {
          userId: ranking.userId,
          postId: ranking.postId,
          locationId: ranking.locationId,
        },
      });
      if (check.length) {
        const message = ranking.postId ? ErrorCode.DUPLICATE_RANKING_POST : ErrorCode.DUPLICATE_RANKING_LOCATION;
        throw new HttpErrors.BadRequest(message);
      }
      if (ranking.locationId) {
        ranking.rankingType = RANKING_TYPE_RANKING_LOCATION;
        const location = await this.locationsRepository.findById(ranking.locationId);
        if (
          [LocationTypesEnum.where.toString(), LocationTypesEnum.food.toString()].includes(location.locationType || '')
        ) {
          ranking.rankingAccessType = RANKING_ACCESS_TYPE_NOT_ACCEPTED;
        } else {
          ranking.rankingAccessType = RANKING_ACCESS_TYPE_ACCEPTED;
        }
      }
      if (ranking.postId) {
        ranking.rankingType = RANKING_TYPE_RANKING_POST;
        ranking.rankingAccessType = RANKING_ACCESS_TYPE_ACCEPTED;
      }

      const result = await this.rankingsRepository.create(ranking);
      //eslint-disable-next-line no-useless-catch
      try {
        await this.updateRankingPoint(result);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handCreateNotification(result);
      } catch (e) {
        throw e;
      }
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async handCreateNotification(ranking: Rankings): Promise<void> {
    if (ranking.rankingType === RANKING_TYPE_RANKING_POST) {
      const targetPost = await this.postsRepository.findById(ranking.postId);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotification({
        listUserReceive: [targetPost.creatorId],
        notificationType: NOTIFICATION_TYPE_USER_RANKING_POST,
        eventCreatorId: ranking.userId,
        targetPost: targetPost.id,
        rankingId: ranking.id,
      });
    }
  }

  async updateRankingPoint(ranking: Rankings): Promise<void> {
    let _score = 0;
    let _averagePoint = 0;
    if (ranking.rankingType === RANKING_TYPE_RANKING_LOCATION && ranking.locationId) {
      const listRanking = await this.rankingsRepository.find({
        where: {
          locationId: ranking.locationId,
          rankingType: RANKING_TYPE_RANKING_LOCATION,
          rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
        },
      });
      if (listRanking.length) {
        listRanking.map((item) => {
          _score += convertPointRankingToPointScore(item.point || 0);
          _averagePoint += item.point || 0;
        });
        _averagePoint = Math.round(_averagePoint / listRanking.length);
      }
      await this.locationsRepository.updateById(ranking.locationId, {
        score: _score,
        averagePoint: _averagePoint,
        totalReview: listRanking.length,
      });
    }
    if (ranking.rankingType === RANKING_TYPE_RANKING_POST && ranking.postId) {
      const listRanking = await this.rankingsRepository.find({
        where: {
          postId: ranking.postId,
          rankingType: RANKING_TYPE_RANKING_POST,
          rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
        },
      });
      if (listRanking.length) {
        listRanking.map((item) => {
          _averagePoint += item.point || 0;
        });
        _averagePoint = Math.round(_averagePoint / listRanking.length);
      }
      await this.postsRepository.updateById(ranking.postId, {
        averagePoint: _averagePoint,
        totalRanking: listRanking.length,
      });
    }
  }

  async updateRankingById(id: number, userId: number, data: AnyObject): Promise<void> {
    await this.rankingsRepository.updateAll(data, {
      id: id,
      userId: userId,
    });
    const result = await this.rankingsRepository.findById(id);
    await this.updateRankingPoint(result);
  }

  async updateAcceptRanking(userId: number, locationId: number, rankingAccessType: string): Promise<void> {
    const target = await this.rankingsRepository.findOne({
      where: {
        userId: userId,
        locationId: locationId,
      },
    });
    if (target?.id) {
      await this.rankingsRepository.updateById(target.id, {
        rankingAccessType: rankingAccessType,
      });
      await this.updateRankingPoint(target);
    }
  }

  async handleAccessRanking(userId: number, locationId: number): Promise<void> {
    const result = await this.postsRepository.find({
      where: {
        creatorId: userId,
        locationId: locationId,
        accessType: POST_ACCESS_TYPE_PUBLIC,
        isPublicLocation: true,
      },
    });
    if (result.length) {
      await this.updateAcceptRanking(userId, locationId, RANKING_ACCESS_TYPE_ACCEPTED);
    } else {
      await this.updateAcceptRanking(userId, locationId, RANKING_ACCESS_TYPE_NOT_ACCEPTED);
    }
  }

  async createNotificationForReplyRanking(replyRanking: ReplyRanking): Promise<void> {
    try {
      const targetRanking = await this.rankingsRepository.findById(replyRanking.rankingId);
      if (targetRanking.rankingType === RANKING_TYPE_RANKING_POST) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.notificationLogicController.createNotification({
          listUserReceive: [targetRanking.userId],
          notificationType: NOTIFICATION_TYPE_USER_REPLY_RANKING,
          eventCreatorId: replyRanking.userId,
          rankingId: replyRanking.rankingId,
          replyRankingId: replyRanking.id,
          targetPost: targetRanking.postId,
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.notificationLogicController.createNotification({
          listUserReceive: [targetRanking.userId],
          notificationType: NOTIFICATION_TYPE_USER_REPLY_RANKING,
          eventCreatorId: replyRanking.userId,
          rankingId: replyRanking.rankingId,
          replyRankingId: replyRanking.id,
        });
      }
    } catch (e) {
      handleError(e);
    }
  }
}
