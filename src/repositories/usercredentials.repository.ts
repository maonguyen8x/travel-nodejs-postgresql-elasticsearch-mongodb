import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Usercredentials, UsercredentialsRelations} from '../models';

export class UsercredentialsRepository extends DefaultCrudRepository<
  Usercredentials,
  typeof Usercredentials.prototype.id,
  UsercredentialsRelations
> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(Usercredentials, dataSource);
  }
}
