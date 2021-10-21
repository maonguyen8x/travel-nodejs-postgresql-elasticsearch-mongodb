import {DefaultCrudRepository} from '@loopback/repository';
import {Ward, WardRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class WardRepository extends DefaultCrudRepository<Ward, typeof Ward.prototype.id, WardRelations> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(Ward, dataSource);
  }
}
