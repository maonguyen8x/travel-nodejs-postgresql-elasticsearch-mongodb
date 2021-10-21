import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserBirthday, UserBirthdayRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserBirthdayRepository extends DefaultCrudRepository<
  UserBirthday,
  typeof UserBirthday.prototype.id,
  UserBirthdayRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserBirthday.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserBirthday, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
