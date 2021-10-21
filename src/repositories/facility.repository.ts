import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  Filter,
  AnyObject,
  Where,
  Count,
} from '@loopback/repository';
import {Facility, FacilityRelations, FacilityCategory, FacilityWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {FacilityCategoryRepository} from './facility-category.repository';
import dayjs from 'dayjs';

export class FacilityRepository extends DefaultCrudRepository<
  Facility,
  typeof Facility.prototype.id,
  FacilityRelations
> {
  public readonly facilityCategory: BelongsToAccessor<FacilityCategory, typeof Facility.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('FacilityCategoryRepository')
    protected facilityCategoryRepositoryGetter: Getter<FacilityCategoryRepository>,
  ) {
    super(Facility, dataSource);
    this.facilityCategory = this.createBelongsToAccessorFor('facilityCategory', facilityCategoryRepositoryGetter);
    this.registerInclusionResolver('facilityCategory', this.facilityCategory.inclusionResolver);
  }

  find(filter?: Filter<Facility>, options?: AnyObject): Promise<FacilityWithRelations[]> {
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

  findOne(filter?: Filter<Facility>, options?: AnyObject): Promise<FacilityWithRelations | null> {
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

  count(where?: Where<Facility>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  deleteById(id: typeof Facility.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(
      id,
      {
        deletedAt: dayjs().toISOString(),
      },
      options,
    );
  }
}
