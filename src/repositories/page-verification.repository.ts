import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {PageVerification, PageVerificationRelations, Page} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {PageRepository} from './page.repository';

export class PageVerificationRepository extends DefaultCrudRepository<
  PageVerification,
  typeof PageVerification.prototype.id,
  PageVerificationRelations
> {
  public readonly page: BelongsToAccessor<Page, typeof PageVerification.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,
  ) {
    super(PageVerification, dataSource);
    this.page = this.createBelongsToAccessorFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);
  }
}
