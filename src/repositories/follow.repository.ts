import {Getter, inject} from '@loopback/core';
import {AnyObject, BelongsToAccessor, DeepPartial, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Follow, FollowRelations, Users} from '../models';
import {UsersRepository} from './users.repository';
import moment from 'moment';
import {FOLLOW_STATUS_ACCEPTED} from '../configs/follow-constants';

export class FollowRepository extends DefaultCrudRepository<Follow, typeof Follow.prototype.id, FollowRelations> {
  public readonly user: BelongsToAccessor<Users, typeof Follow.prototype.id>;

  public readonly following: BelongsToAccessor<Users, typeof Follow.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(Follow, dataSource);
    this.following = this.createBelongsToAccessorFor('following', usersRepositoryGetter);
    this.registerInclusionResolver('following', this.following.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Follow> | {[P in keyof Follow]?: DeepPartial<Follow[P]>} | Follow,
    options?: AnyObject,
  ): Promise<Follow> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof Follow.prototype.id,
    data: Partial<Follow> | {[P in keyof Follow]?: DeepPartial<Follow[P]>} | Follow,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  async getListFollowerById(userId: number): Promise<number[]> {
    const followers = await this.find({
      where: {
        followingId: userId,
        followStatus: FOLLOW_STATUS_ACCEPTED,
      },
    });
    return followers.map((item) => item.userId).filter((item) => item);
  }

  async getListFollowingById(userId: number): Promise<number[]> {
    const followings = await this.find({
      where: {
        userId: userId,
        followStatus: FOLLOW_STATUS_ACCEPTED,
      },
    });
    return followings.map((item) => item.followingId).filter((item) => item);
  }
}
