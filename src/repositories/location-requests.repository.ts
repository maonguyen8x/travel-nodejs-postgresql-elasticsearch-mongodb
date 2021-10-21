import {inject} from '@loopback/core';
import {
  DefaultTransactionalRepository,
  BelongsToAccessor,
  repository,
  Getter,
  Filter,
  AnyObject,
  Where,
  Count,
  Condition,
  AndClause,
  OrClause,
} from '@loopback/repository';
import dayjs from 'dayjs';
import {PostgresqlDataSource} from '../datasources';
import {LocationRequests, LocationRequestsRelations, Users, Locations, LocationRequestsWithRelations} from '../models';
import {UsersRepository, LocationsRepository} from '../repositories';
import {ElasticSearchServiceBindings} from '../keys';
import {ElasticSearchService} from '../services';

export class LocationRequestsRepository extends DefaultTransactionalRepository<
  LocationRequests,
  typeof LocationRequests.prototype.id,
  LocationRequestsRelations
> {
  public readonly creator: BelongsToAccessor<Users, typeof LocationRequests.prototype.id>;
  public readonly location: BelongsToAccessor<Locations, typeof LocationRequests.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
  ) {
    super(LocationRequests, dataSource);

    this.creator = this.createBelongsToAccessorFor('creator', usersRepositoryGetter);
    this.registerInclusionResolver('creator', this.creator.inclusionResolver);

    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.elasticService.setIndex(String(LocationRequests.definition.name).toLowerCase());
  }

  find(filter?: Filter<LocationRequests>, options?: AnyObject): Promise<LocationRequestsWithRelations[]> {
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

  count(where?: Where<LocationRequests>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  findOne(filter?: Filter<LocationRequests>, options?: AnyObject): Promise<LocationRequestsWithRelations | null> {
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

  deleteAll(
    where?: Condition<LocationRequests> | AndClause<LocationRequests> | OrClause<LocationRequests>,
    options?: AnyObject,
  ): Promise<Count> {
    return super.updateAll(
      {
        deletedAt: dayjs().toISOString(),
      },
      where,
      options,
    );
  }
}
