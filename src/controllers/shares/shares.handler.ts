import {AnyObject, Count, Filter, repository, Where} from '@loopback/repository';
import {PostsRepository, SharesRepository, UsersRepository} from '../../repositories';
import {inject} from '@loopback/context';
import {NotificationLogicController, sharesInfoQuery} from '..';
import {Shares} from '../../models';
import {HttpErrors} from '@loopback/rest/dist';
import {POST_ACCESS_TYPE_PUBLIC, POST_TYPE_SHARED} from '../../configs/post-constants';
import {NOTIFICATION_TYPE_USER_SHARE_POST} from '../../configs/notification-constants';
import {handleError} from '../../utils/handleError';

export class SharesHandler {
  constructor(
    @repository(SharesRepository)
    public sharesRepository: SharesRepository,

    @repository(PostsRepository)
    public postsRepository: PostsRepository,

    @repository(UsersRepository)
    public usersRepository: UsersRepository,

    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
  ) {}

  async create(shares: {postId: number; content: string; accessType?: string}, userId: number): Promise<Shares> {
    try {
      const targetPost = await this.postsRepository.findById(shares.postId);
      const newShare = {
        postId: targetPost.sourcePostId || targetPost.id,
        userId: userId,
        content: shares.content,
        postShareId: 0,
      };

      if (!newShare.postId) {
        throw new HttpErrors.BadRequest('Share must be postId');
      }

      const sourcePost = await this.postsRepository.findById(newShare.postId);

      const postShare = await this.postsRepository.create({
        content: shares.content,
        postType: POST_TYPE_SHARED,
        sourcePostId: sourcePost.sourcePostId || sourcePost.id,
        creatorId: userId,
        accessType: shares.accessType ? shares.accessType : POST_ACCESS_TYPE_PUBLIC,
      });
      newShare.postShareId = postShare?.id || 0;
      const result = await this.sharesRepository.create(newShare);

      const totalShare = await this.sharesRepository.count({
        postId: result.postId,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
      });

      await this.postsRepository.updateById(newShare.postId, {
        totalShare: totalShare.count,
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.createNotification({
        listUserReceive: [sourcePost.creatorId],
        notificationType: NOTIFICATION_TYPE_USER_SHARE_POST,
        eventCreatorId: userId,
        // targetPost: postShare.id, // TODO: issue 511 - add to postShareId
        targetPost: targetPost.id,
      });

      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async count(where?: Where<Shares>): Promise<Count> {
    return this.sharesRepository.count(where);
  }

  async find(userId: number, id: number, filter?: Filter<Shares>): Promise<{count: number; data: AnyObject[]}> {
    try {
      const ctrFilter = {
        ...filter,
        ...sharesInfoQuery(userId),
        where: {
          postId: id,
        },
      };
      const result = await this.sharesRepository.find(ctrFilter);
      const count = await this.sharesRepository.count(ctrFilter.where);
      const term = result
        .map((item) => {
          const user: AnyObject = {
            ...(item.user ? this.usersRepository.convertDataUser(item.user) : {}),
            followed: false,
            followStatus: '',
          };
          if (user.following && user.following.length) {
            user.followed = true;
            user.followStatus = user.following[0].followStatus;
            delete user.following;
          }
          return {
            ...item,
            user,
          };
        })
        .filter((item) => item);

      return {
        count: count.count,
        data: term,
      };
    } catch (e) {
      return handleError(e);
    }
  }
}
