import {repository, Filter} from '@loopback/repository';
import {UserProfile, securityId} from '@loopback/security';

import {Users, UsersBlock} from '../../models';
import {UsersBlockRepository, UsersRepository} from '../../repositories';
import {handleError} from '../../utils/handleError';
import {IUserBlockBody} from './users-block.constant';
import {inject} from '@loopback/context';
import {FollowsLogicController, MessagesHandlerController} from '..';

export class UsersBlockHandler {
  constructor(
    @repository(UsersBlockRepository)
    public usersBlockRepository: UsersBlockRepository,
    @repository(UsersRepository) public usersRepository: UsersRepository,
    @inject('controllers.FollowsLogicController')
    public followsLogicController: FollowsLogicController,
    @inject('controllers.MessagesHandlerController')
    public messagesHandlerController: MessagesHandlerController,
  ) {}

  async find(currentUser: UserProfile, filter?: Filter<Users>): Promise<{count: number; data: Users[]}> {
    try {
      const creatorId = parseInt(currentUser[securityId]);
      const userBlocks = await this.usersBlockRepository.find({
        where: {creatorId},
      });
      const userBlockIds = userBlocks.map((userBlock) => userBlock.userId);

      const where = {...filter?.where, id: {inq: userBlockIds}};
      const users = await this.usersRepository.find({...filter, where});
      const Count = await this.usersRepository.count(where);

      return {count: Count.count, data: users};
    } catch (error) {
      return handleError(error);
    }
  }

  async create(body: IUserBlockBody, filter?: Filter<UsersBlock>): Promise<{success: boolean}> {
    try {
      const userBlock = await this.usersBlockRepository.create(body);

      await this.usersBlockRepository.findById(userBlock.id, filter);

      // remove follow
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.followsLogicController.removeFollower(body.userId, body.creatorId);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.followsLogicController.removeFollower(body.creatorId, body.userId);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.messagesHandlerController.blockUser(body.userId, body.creatorId);

      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteByUserId(body: IUserBlockBody): Promise<{success: boolean}> {
    try {
      const filter = {where: {...body}};
      const userBlock = await this.usersBlockRepository.findOne(filter);

      if (!userBlock) return {success: true};

      await this.usersBlockRepository.deleteById(userBlock.id);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.messagesHandlerController.unBlockUser(body.userId, body.creatorId);

      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async getListUserBlockIds(userId?: number): Promise<number[]> {
    try {
      if (!userId) {
        return [];
      }
      let result: number[] = [];
      const userBlocks = await this.usersBlockRepository.find({
        fields: {
          creatorId: true,
        },
        where: {
          userId,
        },
      });
      const blocker = await this.usersBlockRepository.find({
        fields: {
          userId: true,
        },
        where: {
          creatorId: userId,
        },
      });
      result = [...result, ...userBlocks.map((block) => block.creatorId), ...blocker.map((block) => block.userId)];
      return result;
    } catch (e) {
      handleError(e);
      return [];
    }
  }

  async checkBlockedByUserId(userId: number, targetId: number): Promise<Boolean> {
    let check: UsersBlock | null;
    check = await this.usersBlockRepository.findOne({
      where: {
        userId,
        creatorId: targetId,
      },
    });
    if (check) {
      return true;
    }
    check = await this.usersBlockRepository.findOne({
      where: {
        userId: targetId,
        creatorId: userId,
      },
    });
    return !!check;
  }
}
