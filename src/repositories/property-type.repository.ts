import {DefaultCrudRepository} from '@loopback/repository';
import {PropertyType, PropertyTypeRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class PropertyTypeRepository extends DefaultCrudRepository<
  PropertyType,
  typeof PropertyType.prototype.id,
  PropertyTypeRelations
> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(PropertyType, dataSource);
  }
}
