import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Province, ProvinceRelations, Town} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {TownRepository} from './town.repository';

export class ProvinceRepository extends DefaultCrudRepository<
  Province,
  typeof Province.prototype.id,
  ProvinceRelations
> {
  public readonly towns: HasManyRepositoryFactory<Town, typeof Province.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('TownRepository')
    protected townRepositoryGetter: Getter<TownRepository>,
  ) {
    super(Province, dataSource);
    this.towns = this.createHasManyRepositoryFactoryFor('towns', townRepositoryGetter);
    this.registerInclusionResolver('towns', this.towns.inclusionResolver);
  }
}
