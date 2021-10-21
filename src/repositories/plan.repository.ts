import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  HasManyRepositoryFactory,
  DeepPartial,
  AnyObject,
} from '@loopback/repository';
import {Plan, PlanRelations, Users, Task} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UsersRepository} from './users.repository';
import {TaskRepository} from './task.repository';
import moment from 'moment';

export class PlanRepository extends DefaultCrudRepository<Plan, typeof Plan.prototype.id, PlanRelations> {
  public readonly user: BelongsToAccessor<Users, typeof Plan.prototype.id>;

  public readonly tasks: HasManyRepositoryFactory<Task, typeof Plan.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('TaskRepository')
    protected taskRepositoryGetter: Getter<TaskRepository>,
  ) {
    super(Plan, dataSource);
    this.tasks = this.createHasManyRepositoryFactoryFor('tasks', taskRepositoryGetter);
    this.registerInclusionResolver('tasks', this.tasks.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Plan> | {[P in keyof Plan]?: DeepPartial<Plan[P]>} | Plan,
    options?: AnyObject,
  ): Promise<Plan> {
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
    id: typeof Plan.prototype.id,
    data: Partial<Plan> | {[P in keyof Plan]?: DeepPartial<Plan[P]>} | Plan,
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
