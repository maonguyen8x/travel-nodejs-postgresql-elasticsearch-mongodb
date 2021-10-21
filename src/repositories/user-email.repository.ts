import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {UserEmail, UserEmailRelations, Users} from '../models';
import {UsersRepository} from './users.repository';

export class UserEmailRepository extends DefaultCrudRepository<
  UserEmail,
  typeof UserEmail.prototype.id,
  UserEmailRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof UserEmail.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(UserEmail, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
