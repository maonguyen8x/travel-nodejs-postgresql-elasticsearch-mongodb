import {DefaultCrudRepository, repository, BelongsToAccessor, DeepPartial, AnyObject} from '@loopback/repository';
import {Task, TaskRelations, Plan, Locations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {PlanRepository} from './plan.repository';
import {LocationsRepository} from './locations.repository';
import moment from 'moment';

export class TaskRepository extends DefaultCrudRepository<Task, typeof Task.prototype.id, TaskRelations> {
  public readonly plan: BelongsToAccessor<Plan, typeof Task.prototype.id>;

  public readonly location: BelongsToAccessor<Locations, typeof Task.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('PlanRepository')
    protected planRepositoryGetter: Getter<PlanRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
  ) {
    super(Task, dataSource);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.plan = this.createBelongsToAccessorFor('plan', planRepositoryGetter);
    this.registerInclusionResolver('plan', this.plan.inclusionResolver);
  }

  create(
    entity: Partial<Task> | {[P in keyof Task]?: DeepPartial<Task[P]>} | Task,
    options?: AnyObject,
  ): Promise<Task> {
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
    id: typeof Task.prototype.id,
    data: Partial<Task> | {[P in keyof Task]?: DeepPartial<Task[P]>} | Task,
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
