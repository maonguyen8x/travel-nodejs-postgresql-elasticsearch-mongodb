import {Getter, inject} from '@loopback/core';
import {
  AndClause,
  AnyObject,
  BelongsToAccessor,
  Condition,
  Count,
  DataObject,
  DeepPartial,
  DefaultCrudRepository,
  OrClause,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {Posts, Shares, SharesRelations, Users} from '../models';
import {PostsRepository} from './posts.repository';
import {UsersRepository} from './users.repository';

export class SharesRepository extends DefaultCrudRepository<Shares, typeof Shares.prototype.id, SharesRelations> {
  public readonly user: BelongsToAccessor<Users, typeof Shares.prototype.id>;

  public readonly post: BelongsToAccessor<Posts, typeof Shares.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
  ) {
    super(Shares, dataSource);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Shares> | {[P in keyof Shares]?: DeepPartial<Shares[P]>} | Shares,
    options?: AnyObject,
  ): Promise<Shares> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  createAll(entities: DataObject<Shares>[], options?: AnyObject): Promise<Shares[]> {
    const newData = Array.from(entities, (item) => {
      return {
        ...item,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      };
    });
    return super.createAll(newData, options);
  }

  update(entity: Shares, options?: AnyObject): Promise<void> {
    const newData = new Shares({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(newData, options);
  }

  updateAll(
    data: Partial<Shares> | {[P in keyof Shares]?: DeepPartial<Shares[P]>} | Shares,
    where?: Condition<Shares> | AndClause<Shares> | OrClause<Shares>,
    options?: AnyObject,
  ): Promise<Count> {
    return super.updateAll(
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      where,
      options,
    );
  }

  updateById(
    id: typeof Shares.prototype.id,
    data: Partial<Shares> | {[P in keyof Shares]?: DeepPartial<Shares[P]>} | Shares,
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
