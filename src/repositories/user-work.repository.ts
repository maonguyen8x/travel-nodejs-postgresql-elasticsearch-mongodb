import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserWork, UserWorkRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserWorkRepository extends DefaultCrudRepository<
  UserWork,
  typeof UserWork.prototype.id,
  UserWorkRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserWork.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserWork, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
