import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Town, TownRelations, Ward} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {WardRepository} from './ward.repository';

export class TownRepository extends DefaultCrudRepository<Town, typeof Town.prototype.id, TownRelations> {
  public readonly wards: HasManyRepositoryFactory<Ward, typeof Town.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('WardRepository')
    protected wardRepositoryGetter: Getter<WardRepository>,
  ) {
    super(Town, dataSource);
    this.wards = this.createHasManyRepositoryFactoryFor('wards', wardRepositoryGetter);
    this.registerInclusionResolver('wards', this.wards.inclusionResolver);
  }
}
