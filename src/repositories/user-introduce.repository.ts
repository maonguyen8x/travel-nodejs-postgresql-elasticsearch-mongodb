import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserIntroduce, UserIntroduceRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserIntroduceRepository extends DefaultCrudRepository<
  UserIntroduce,
  typeof UserIntroduce.prototype.id,
  UserIntroduceRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserIntroduce.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserIntroduce, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
