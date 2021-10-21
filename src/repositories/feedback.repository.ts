import {DefaultCrudRepository, repository, BelongsToAccessor, DeepPartial, AnyObject} from '@loopback/repository';
import {Feedback, FeedbackRelations, Users} from '../models';
import {MongodbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UsersRepository} from './users.repository';
import moment from 'moment';

export class FeedbackRepository extends DefaultCrudRepository<
  Feedback,
  typeof Feedback.prototype.id,
  FeedbackRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Feedback.prototype.id>;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(Feedback, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Feedback> | {[P in keyof Feedback]?: DeepPartial<Feedback[P]>} | Feedback,
    options?: AnyObject,
  ): Promise<Feedback> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
