import {
  DefaultCrudRepository,
  repository,
  HasManyRepositoryFactory,
  Filter,
  AnyObject,
  Where,
  Count,
} from '@loopback/repository';
import {FacilityCategory, FacilityCategoryRelations, Facility, FacilityCategoryWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {FacilityRepository} from './facility.repository';
import dayjs from 'dayjs';

export class FacilityCategoryRepository extends DefaultCrudRepository<
  FacilityCategory,
  typeof FacilityCategory.prototype.id,
  FacilityCategoryRelations
> {
  public readonly facilities: HasManyRepositoryFactory<Facility, typeof FacilityCategory.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('FacilityRepository')
    protected facilityRepositoryGetter: Getter<FacilityRepository>,
  ) {
    super(FacilityCategory, dataSource);
    this.facilities = this.createHasManyRepositoryFactoryFor('facilities', facilityRepositoryGetter);
    this.registerInclusionResolver('facilities', this.facilities.inclusionResolver);
  }

  find(filter?: Filter<FacilityCategory>, options?: AnyObject): Promise<FacilityCategoryWithRelations[]> {
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

  findOne(filter?: Filter<FacilityCategory>, options?: AnyObject): Promise<FacilityCategoryWithRelations | null> {
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

  count(where?: Where<FacilityCategory>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  deleteById(id: typeof FacilityCategory.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(
      id,
      {
        deletedAt: dayjs().toISOString(),
      },
      options,
    );
  }
}
