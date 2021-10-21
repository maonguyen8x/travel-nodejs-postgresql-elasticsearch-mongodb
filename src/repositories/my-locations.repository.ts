import {Getter, inject} from '@loopback/core';
import {AnyObject, BelongsToAccessor, DeepPartial, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Locations, MyLocations, MyLocationsRelations, Users} from '../models';
import {LocationsRepository} from './locations.repository';
import {UsersRepository} from './users.repository';
import moment from 'moment';

export class MyLocationsRepository extends DefaultCrudRepository<
  MyLocations,
  typeof MyLocations.prototype.id,
  MyLocationsRelations
> {
  public readonly location: BelongsToAccessor<Locations, typeof MyLocations.prototype.id>;

  public readonly user: BelongsToAccessor<Users, typeof MyLocations.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(MyLocations, dataSource);

    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);

    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
  }

  create(
    entity: Partial<MyLocations> | {[P in keyof MyLocations]?: DeepPartial<MyLocations[P]>} | MyLocations,
    options?: AnyObject,
  ): Promise<MyLocations> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof MyLocations.prototype.id,
    data: Partial<MyLocations> | {[P in keyof MyLocations]?: DeepPartial<MyLocations[P]>} | MyLocations,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
