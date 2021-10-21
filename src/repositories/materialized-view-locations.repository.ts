import {DefaultCrudRepository} from '@loopback/repository';
import {MaterializedViewLocations, MaterializedViewLocationsRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class MaterializedViewLocationsRepository extends DefaultCrudRepository<
  MaterializedViewLocations,
  typeof MaterializedViewLocations.prototype.id,
  MaterializedViewLocationsRelations
> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(MaterializedViewLocations, dataSource);
  }

  async refeshMaterializedViewLocations() {
    return this.dataSource.execute('REFRESH MATERIALIZED VIEW CONCURRENTLY materializedviewlocations');
  }
}
