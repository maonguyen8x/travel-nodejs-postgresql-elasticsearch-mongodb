import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Profiles, UserWebsite, UserWebsiteRelations} from '../models';
import {ProfilesRepository} from './profiles.repository';

export class UserWebsiteRepository extends DefaultCrudRepository<
  UserWebsite,
  typeof UserWebsite.prototype.id,
  UserWebsiteRelations
> {
  public readonly profile: BelongsToAccessor<Profiles, typeof UserWebsite.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(UserWebsite, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }
}
