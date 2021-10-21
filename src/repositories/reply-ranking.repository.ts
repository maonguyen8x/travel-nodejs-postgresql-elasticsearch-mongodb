import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
  DeepPartial,
  AnyObject,
} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Likes, Rankings, ReplyRanking, ReplyRankingRelations, Users} from '../models';
import {LikesRepository} from './likes.repository';
import {RankingsRepository} from './rankings.repository';
import {UsersRepository} from './users.repository';
import moment from 'moment';

export class ReplyRankingRepository extends DefaultCrudRepository<
  ReplyRanking,
  typeof ReplyRanking.prototype.id,
  ReplyRankingRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof ReplyRanking.prototype.id>;

  public readonly ranking: BelongsToAccessor<Rankings, typeof ReplyRanking.prototype.id>;

  public readonly likes: HasManyRepositoryFactory<Likes, typeof ReplyRanking.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @repository.getter('LikesRepository')
    protected likesRepositoryGetter: Getter<LikesRepository>,
  ) {
    super(ReplyRanking, dataSource);
    this.likes = this.createHasManyRepositoryFactoryFor('likes', likesRepositoryGetter);
    this.registerInclusionResolver('likes', this.likes.inclusionResolver);
    this.ranking = this.createBelongsToAccessorFor('ranking', rankingsRepositoryGetter);
    this.registerInclusionResolver('ranking', this.ranking.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<ReplyRanking> | {[P in keyof ReplyRanking]?: DeepPartial<ReplyRanking[P]>} | ReplyRanking,
    options?: AnyObject,
  ): Promise<ReplyRanking> {
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
    id: typeof ReplyRanking.prototype.id,
    data: Partial<ReplyRanking> | {[P in keyof ReplyRanking]?: DeepPartial<ReplyRanking[P]>} | ReplyRanking,
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
