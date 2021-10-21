import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  Filter,
  AnyObject,
  Where,
  Count,
} from '@loopback/repository';
import {Stay, StayRelations, Service, AccommodationType, StayWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ServiceRepository} from './service.repository';
import {ElasticSearchServiceBindings} from '../keys';
import {ElasticSearchService} from '../services';
import {AccommodationTypeRepository} from './accommodation-type.repository';
import dayjs = require('dayjs');

export class StayRepository extends DefaultCrudRepository<Stay, typeof Stay.prototype.id, StayRelations> {
  public readonly service: BelongsToAccessor<Service, typeof Stay.prototype.id>;
  public readonly accommodationType: BelongsToAccessor<AccommodationType, typeof Stay.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('ServiceRepository')
    protected serviceRepositoryGetter: Getter<ServiceRepository>,
    @repository.getter('AccommodationTypeRepository')
    protected accommodationTypeRepositoryGetter: Getter<AccommodationTypeRepository>,

    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
  ) {
    super(Stay, dataSource);

    this.service = this.createBelongsToAccessorFor('service', serviceRepositoryGetter);
    this.registerInclusionResolver('service', this.service.inclusionResolver);

    this.accommodationType = this.createBelongsToAccessorFor('accommodationType', accommodationTypeRepositoryGetter);
    this.registerInclusionResolver('accommodationType', this.accommodationType.inclusionResolver);

    this.elasticService.setIndex(String(Stay.definition.name).toLowerCase());
  }

  find(filter?: Filter<Stay>, options?: AnyObject): Promise<(Stay & StayWithRelations)[]> {
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

  findOne(filter?: Filter<Stay>, options?: AnyObject): Promise<(Stay & StayWithRelations) | null> {
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

  count(where?: Where<Stay>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  deleteById(id: typeof Stay.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(id, {
      deletedAt: dayjs().toISOString(),
    });
  }
}
