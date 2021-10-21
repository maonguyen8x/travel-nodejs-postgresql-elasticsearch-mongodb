import {
  DefaultTransactionalRepository,
  BelongsToAccessor,
  repository,
  Getter,
  DeepPartial,
  AnyObject,
  HasOneRepositoryFactory,
} from '@loopback/repository';
import {inject} from '@loopback/core';

import {PostgresqlDataSource} from '../datasources';
import {
  Page,
  PageRelations,
  Locations,
  Users,
  MediaContents,
  PageVerification,
  Currency,
  PropertyType,
} from '../models';
import {LocationsRepository, UsersRepository, MediaContentsRepository, PropertyTypeRepository} from './';
import {handleError} from '../utils/handleError';
import {MaterializedViewLocationsRepository} from './materialized-view-locations.repository';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '../constants/error.constant';
import {PageVerificationRepository} from './page-verification.repository';
import {CurrencyRepository} from './currency.repository';
import {ElasticSearchServiceBindings} from '../keys';
import {ElasticSearchService} from '../services';

export class PageRepository extends DefaultTransactionalRepository<Page, typeof Page.prototype.id, PageRelations> {
  public readonly location: BelongsToAccessor<Locations, typeof Page.prototype.id>;
  public readonly user: BelongsToAccessor<Users, typeof Page.prototype.id>;
  public readonly relatedUser: BelongsToAccessor<Users, typeof Page.prototype.id>;
  public readonly avatar: BelongsToAccessor<MediaContents, typeof Page.prototype.id>;
  public readonly background: BelongsToAccessor<MediaContents, typeof Page.prototype.id>;
  public readonly stayPropertytype: BelongsToAccessor<PropertyType, typeof Page.prototype.id>;

  public readonly pageVerification: HasOneRepositoryFactory<PageVerification, typeof Page.prototype.id>;
  public readonly currency: BelongsToAccessor<Currency, typeof Page.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @repository.getter('PropertyTypeRepository')
    protected propertyTypeRepositoryGetter: Getter<PropertyTypeRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('MediaContentsRepository')
    protected mediaContentsRepositoryGetter: Getter<MediaContentsRepository>,
    @repository.getter('CurrencyRepository')
    protected currencyRepositoryGetter: Getter<CurrencyRepository>,

    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
    @repository.getter('PageVerificationRepository')
    protected pageVerificationRepositoryGetter: Getter<PageVerificationRepository>,
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
  ) {
    super(Page, dataSource);
    this.pageVerification = this.createHasOneRepositoryFactoryFor('pageVerification', pageVerificationRepositoryGetter);
    this.registerInclusionResolver('pageVerification', this.pageVerification.inclusionResolver);

    // include location
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);

    // include user
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);

    // include  related user
    this.relatedUser = this.createBelongsToAccessorFor('relatedUser', usersRepositoryGetter);
    this.registerInclusionResolver('relatedUser', this.relatedUser.inclusionResolver);

    // include avatar
    this.avatar = this.createBelongsToAccessorFor('avatar', mediaContentsRepositoryGetter);
    this.registerInclusionResolver('avatar', this.avatar.inclusionResolver);

    // include background
    this.background = this.createBelongsToAccessorFor('background', mediaContentsRepositoryGetter);
    this.registerInclusionResolver('background', this.background.inclusionResolver);

    // include currency
    this.currency = this.createBelongsToAccessorFor('currency', currencyRepositoryGetter);
    this.registerInclusionResolver('currency', this.currency.inclusionResolver);

    // include stayPropertytype
    this.stayPropertytype = this.createBelongsToAccessorFor('stayPropertytype', propertyTypeRepositoryGetter);
    this.registerInclusionResolver('stayPropertytype', this.stayPropertytype.inclusionResolver);

    this.elasticService.setIndex(String(Page.definition.name).toLowerCase());
  }

  async create(
    entity: Partial<Page> | {[P in keyof Page]?: DeepPartial<Page[P]>} | Page,
    options?: AnyObject,
  ): Promise<Page> {
    try {
      const page = await super.create(entity, options);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
      return page;
    } catch (error) {
      return handleError(error);
    }
  }

  async updateById(
    id: typeof Page.prototype.id,
    data: Partial<Page> | {[P in keyof Page]?: DeepPartial<Page[P]>} | Page,
    options?: AnyObject,
  ): Promise<void> {
    try {
      await super.updateById(id, data, options);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
    } catch (error) {
      return handleError(error);
    }
  }

  async validatePermissionModifyPage(pageId: number, userId: number): Promise<Page> {
    try {
      const page = await super.findById(pageId);
      const hadPermision = !(!page || (page.userId !== userId && page.relatedUserId !== userId));

      if (!hadPermision) throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);

      return page;
    } catch (error) {
      return handleError(error);
    }
  }
}
