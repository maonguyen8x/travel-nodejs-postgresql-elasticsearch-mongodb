import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserPhone, UserPhoneRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserPhoneRepository extends DefaultCrudRepository<
  UserPhone,
  typeof UserPhone.prototype.id,
  UserPhoneRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserPhone.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserPhone, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
