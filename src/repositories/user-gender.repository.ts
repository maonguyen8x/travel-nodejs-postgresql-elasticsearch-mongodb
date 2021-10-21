import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserGender, UserGenderRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserGenderRepository extends DefaultCrudRepository<
  UserGender,
  typeof UserGender.prototype.id,
  UserGenderRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserGender.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserGender, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
