import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  Filter,
  AnyObject,
  Where,
  Count,
} from '@loopback/repository';
import {Amenity, AmenityRelations, AmenityCategory, AmenityWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {AmenityCategoryRepository} from './amenity-category.repository';
import dayjs from 'dayjs';

export class AmenityRepository extends DefaultCrudRepository<Amenity, typeof Amenity.prototype.id, AmenityRelations> {
  public readonly amenityCategory: BelongsToAccessor<AmenityCategory, typeof Amenity.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('AmenityCategoryRepository')
    protected amenityCategoryRepositoryGetter: Getter<AmenityCategoryRepository>,
  ) {
    super(Amenity, dataSource);
    this.amenityCategory = this.createBelongsToAccessorFor('amenityCategory', amenityCategoryRepositoryGetter);
    this.registerInclusionResolver('amenityCategory', this.amenityCategory.inclusionResolver);
  }

  find(filter?: Filter<Amenity>, options?: AnyObject): Promise<AmenityWithRelations[]> {
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

  findOne(filter?: Filter<Amenity>, options?: AnyObject): Promise<AmenityWithRelations | null> {
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

  count(where?: Where<Amenity>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  deleteById(id: typeof Amenity.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(
      id,
      {
        deletedAt: dayjs().utc().toISOString(),
      },
      options,
    );
  }
}
