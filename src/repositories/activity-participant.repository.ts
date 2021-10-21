import {DefaultCrudRepository, BelongsToAccessor, repository} from '@loopback/repository';
import {ActivityParticipant, ActivityParticipantRelations, Activity, Users} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ActivityRepository} from './activity.repository';
import {UsersRepository} from './users.repository';

export class ActivityParticipantRepository extends DefaultCrudRepository<
  ActivityParticipant,
  typeof ActivityParticipant.prototype.id,
  ActivityParticipantRelations
> {
  public readonly activity: BelongsToAccessor<Activity, typeof ActivityParticipant.prototype.id>;

  public readonly user: BelongsToAccessor<Users, typeof ActivityParticipant.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('ActivityRepository')
    protected activityRepositoryGetter: Getter<ActivityRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(ActivityParticipant, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.activity = this.createBelongsToAccessorFor('activity', activityRepositoryGetter);
    this.registerInclusionResolver('activity', this.activity.inclusionResolver);
  }
}
