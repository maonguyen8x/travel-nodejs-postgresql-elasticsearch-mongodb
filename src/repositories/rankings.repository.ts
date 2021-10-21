import {Getter, inject} from '@loopback/core';
import {
  AndClause,
  AnyObject,
  BelongsToAccessor,
  Condition,
  Count,
  DataObject,
  DeepPartial,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  OrClause,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {Likes, Locations, Posts, Rankings, RankingsRelations, ReplyRanking, Users} from '../models';
import {LikesRepository} from './likes.repository';
import {LocationsRepository} from './locations.repository';
import {PostsRepository} from './posts.repository';
import {ReplyRankingRepository} from './reply-ranking.repository';
import {UsersRepository} from './users.repository';

export class RankingsRepository extends DefaultCrudRepository<
  Rankings,
  typeof Rankings.prototype.id,
  RankingsRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Rankings.prototype.id>;

  public readonly location: BelongsToAccessor<Locations, typeof Rankings.prototype.id>;

  public readonly post: BelongsToAccessor<Posts, typeof Rankings.prototype.id>;

  public readonly likes: HasManyRepositoryFactory<Likes, typeof Rankings.prototype.id>;

  public readonly replyRankings: HasManyRepositoryFactory<ReplyRanking, typeof Rankings.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('LikesRepository')
    protected likesRepositoryGetter: Getter<LikesRepository>,
    @repository.getter('ReplyRankingRepository')
    protected replyRankingRepositoryGetter: Getter<ReplyRankingRepository>,
  ) {
    super(Rankings, dataSource);
    this.replyRankings = this.createHasManyRepositoryFactoryFor('replyRankings', replyRankingRepositoryGetter);
    this.registerInclusionResolver('replyRankings', this.replyRankings.inclusionResolver);
    this.likes = this.createHasManyRepositoryFactoryFor('likes', likesRepositoryGetter);
    this.registerInclusionResolver('likes', this.likes.inclusionResolver);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Rankings> | {[P in keyof Rankings]?: DeepPartial<Rankings[P]>} | Rankings,
    options?: AnyObject,
  ): Promise<Rankings> {
    return super.create(
      {
        ...entity,
        totalLike: 0,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  createAll(entities: DataObject<Rankings>[], options?: AnyObject): Promise<Rankings[]> {
    const newData = Array.from(entities, (item) => {
      return {
        ...item,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      };
    });
    return super.createAll(newData, options);
  }

  update(entity: Rankings, options?: AnyObject): Promise<void> {
    const newData = new Rankings({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(newData, options);
  }

  updateAll(
    data: Partial<Rankings> | {[P in keyof Rankings]?: DeepPartial<Rankings[P]>} | Rankings,
    where?: Condition<Rankings> | AndClause<Rankings> | OrClause<Rankings>,
    options?: AnyObject,
  ): Promise<Count> {
    return super.updateAll(
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      where,
      options,
    );
  }

  updateById(
    id: typeof Rankings.prototype.id,
    data: Partial<Rankings> | {[P in keyof Rankings]?: DeepPartial<Rankings[P]>} | Rankings,
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
}
