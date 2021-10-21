import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {StaticPage, StaticPageRelations} from '../models';

export class StaticPageRepository extends DefaultCrudRepository<
  StaticPage,
  typeof StaticPage.prototype.id,
  StaticPageRelations
> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(StaticPage, dataSource);
  }
}
