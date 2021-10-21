import {Getter, inject} from '@loopback/core';
import {AnyObject, BelongsToAccessor, DeepPartial, DefaultCrudRepository, repository} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {Interesting, InterestingRelations, Locations, Users} from '../models';
import {LocationsRepository} from './locations.repository';
import {UsersRepository} from './users.repository';

export class InterestingRepository extends DefaultCrudRepository<
  Interesting,
  typeof Interesting.prototype.id,
  InterestingRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Interesting.prototype.id>;

  public readonly location: BelongsToAccessor<Locations, typeof Interesting.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
  ) {
    super(Interesting, dataSource);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Interesting> | {[P in keyof Interesting]?: DeepPartial<Interesting[P]>} | Interesting,
    options?: AnyObject,
  ): Promise<Interesting> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
