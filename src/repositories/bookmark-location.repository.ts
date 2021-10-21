import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  Filter,
  AnyObject,
  FilterExcludingWhere,
} from '@loopback/repository';
import {BookmarkLocation, BookmarkLocationRelations, Users, Locations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UsersRepository} from './users.repository';
import {LocationsRepository} from './locations.repository';
import dayjs = require('dayjs');

export class BookmarkLocationRepository extends DefaultCrudRepository<
  BookmarkLocation,
  typeof BookmarkLocation.prototype.id,
  BookmarkLocationRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof BookmarkLocation.prototype.id>;

  public readonly location: BelongsToAccessor<Locations, typeof BookmarkLocation.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
  ) {
    super(BookmarkLocation, dataSource);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  findOne(
    filter?: Filter<BookmarkLocation>,
    options?: AnyObject,
  ): Promise<(BookmarkLocation & BookmarkLocationRelations) | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
        },
      },
      options,
    );
  }

  find(
    filter?: Filter<BookmarkLocation>,
    options?: AnyObject,
  ): Promise<(BookmarkLocation & BookmarkLocationRelations)[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
        },
      },
      options,
    );
  }

  findById(
    id: typeof BookmarkLocation.prototype.id,
    filter?: FilterExcludingWhere<BookmarkLocation>,
    options?: AnyObject,
  ): Promise<BookmarkLocation & BookmarkLocationRelations> {
    return super.findById(id, filter, options);
  }

  async exists(id: typeof BookmarkLocation.prototype.id, options?: AnyObject): Promise<boolean> {
    const exist = await this.findOne({
      where: {
        id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
      },
    });
    return Boolean(exist);
  }

  async deleteById(id: typeof BookmarkLocation.prototype.id, options?: AnyObject): Promise<void> {
    const exist = await this.exists(id);
    if (!exist) {
      return;
    }
    return super.updateById(id, {
      deletedAt: dayjs().toISOString(),
    });
  }
}
