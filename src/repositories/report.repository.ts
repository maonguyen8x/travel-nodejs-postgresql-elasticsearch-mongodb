import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Locations, Posts, Rankings, Report, ReportRelations, Users} from '../models';
import {LocationsRepository} from './locations.repository';
import {PostsRepository} from './posts.repository';
import {RankingsRepository} from './rankings.repository';
import {UsersRepository} from './users.repository';

export class ReportRepository extends DefaultCrudRepository<Report, typeof Report.prototype.id, ReportRelations> {
  public readonly user: BelongsToAccessor<Users, typeof Report.prototype.id>;

  public readonly targetUser: BelongsToAccessor<Users, typeof Report.prototype.id>;

  public readonly targetPost: BelongsToAccessor<Posts, typeof Report.prototype.id>;

  public readonly targetRanking: BelongsToAccessor<Rankings, typeof Report.prototype.id>;

  public readonly targetLocation: BelongsToAccessor<Locations, typeof Report.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
  ) {
    super(Report, dataSource);
    this.targetLocation = this.createBelongsToAccessorFor('targetLocation', locationsRepositoryGetter);
    this.registerInclusionResolver('targetLocation', this.targetLocation.inclusionResolver);
    this.targetRanking = this.createBelongsToAccessorFor('targetRanking', rankingsRepositoryGetter);
    this.registerInclusionResolver('targetRanking', this.targetRanking.inclusionResolver);
    this.targetPost = this.createBelongsToAccessorFor('targetPost', postsRepositoryGetter);
    this.registerInclusionResolver('targetPost', this.targetPost.inclusionResolver);
    this.targetUser = this.createBelongsToAccessorFor('targetUser', usersRepositoryGetter);
    this.registerInclusionResolver('targetUser', this.targetUser.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
