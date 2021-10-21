import {DefaultTransactionalRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {ActivityBookmark, ActivityBookmarkRelations, Activity, Users} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ActivityRepository} from './activity.repository';
import {UsersRepository} from './users.repository';

export class ActivityBookmarkRepository extends DefaultTransactionalRepository<
  ActivityBookmark,
  typeof ActivityBookmark.prototype.id,
  ActivityBookmarkRelations
> {
  public readonly activity: BelongsToAccessor<Activity, typeof ActivityBookmark.prototype.id>;

  public readonly user: BelongsToAccessor<Users, typeof ActivityBookmark.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('ActivityRepository')
    protected activityRepositoryGetter: Getter<ActivityRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(ActivityBookmark, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.activity = this.createBelongsToAccessorFor('activity', activityRepositoryGetter);
    this.registerInclusionResolver('activity', this.activity.inclusionResolver);
  }
}
