import {inject} from '@loopback/core';
import {DefaultCrudRepository, BelongsToAccessor, repository, Getter} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {UsersBlock, UsersBlockRelations, Users} from '../models';
import {UsersRepository} from '../repositories';

export class UsersBlockRepository extends DefaultCrudRepository<
  UsersBlock,
  typeof UsersBlock.prototype.id,
  UsersBlockRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof UsersBlock.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(UsersBlock, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
