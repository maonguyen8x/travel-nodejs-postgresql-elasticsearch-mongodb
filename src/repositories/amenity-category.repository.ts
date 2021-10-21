import {
  DefaultCrudRepository,
  repository,
  HasManyRepositoryFactory,
  Filter,
  AnyObject,
  Where,
  Count,
} from '@loopback/repository';
import dayjs from 'dayjs';
import {AmenityCategory, AmenityCategoryRelations, Amenity, AmenityCategoryWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AmenityRepository} from './amenity.repository';

export class AmenityCategoryRepository extends DefaultCrudRepository<
  AmenityCategory,
  typeof AmenityCategory.prototype.id,
  AmenityCategoryRelations
> {
  public readonly amenities: HasManyRepositoryFactory<Amenity, typeof AmenityCategory.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('AmenityRepository')
    protected amenityRepositoryGetter: Getter<AmenityRepository>,
  ) {
    super(AmenityCategory, dataSource);
    this.amenities = this.createHasManyRepositoryFactoryFor('amenities', amenityRepositoryGetter);
    this.registerInclusionResolver('amenities', this.amenities.inclusionResolver);
  }

  find(filter?: Filter<AmenityCategory>, options?: AnyObject): Promise<AmenityCategoryWithRelations[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
        },
      },
      options,
    );
  }

  findOne(filter?: Filter<AmenityCategory>, options?: AnyObject): Promise<AmenityCategoryWithRelations | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
        },
      },
      options,
    );
  }

  count(where?: Where<AmenityCategory>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  deleteById(id: typeof AmenityCategory.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(
      id,
      {
        deletedAt: dayjs().utc().toISOString(),
      },
      options,
    );
  }
}
