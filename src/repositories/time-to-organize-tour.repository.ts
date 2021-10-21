import {DefaultCrudRepository, repository, BelongsToAccessor, DeepPartial, AnyObject} from '@loopback/repository';
import {TimeToOrganizeTour, TimeToOrganizeTourRelations, Tour} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {TourRepository} from './tour.repository';
import moment from 'moment';

export class TimeToOrganizeTourRepository extends DefaultCrudRepository<
  TimeToOrganizeTour,
  typeof TimeToOrganizeTour.prototype.id,
  TimeToOrganizeTourRelations
> {
  public readonly tour: BelongsToAccessor<Tour, typeof TimeToOrganizeTour.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('TourRepository')
    protected tourRepositoryGetter: Getter<TourRepository>,
  ) {
    super(TimeToOrganizeTour, dataSource);
    this.tour = this.createBelongsToAccessorFor('tour', tourRepositoryGetter);
    this.registerInclusionResolver('tour', this.tour.inclusionResolver);
  }

  create(
    entity:
      | Partial<TimeToOrganizeTour>
      | {[P in keyof TimeToOrganizeTour]?: DeepPartial<TimeToOrganizeTour[P]>}
      | TimeToOrganizeTour,
    options?: AnyObject,
  ): Promise<TimeToOrganizeTour> {
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
    id: typeof TimeToOrganizeTour.prototype.id,
    data:
      | Partial<TimeToOrganizeTour>
      | {[P in keyof TimeToOrganizeTour]?: DeepPartial<TimeToOrganizeTour[P]>}
      | TimeToOrganizeTour,
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
