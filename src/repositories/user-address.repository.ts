import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserAddress, UserAddressRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserAddressRepository extends DefaultCrudRepository<
  UserAddress,
  typeof UserAddress.prototype.id,
  UserAddressRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserAddress.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserAddress, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
