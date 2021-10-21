import {
  DefaultCrudRepository,
  BelongsToAccessor,
  repository,
  Getter,
  HasOneRepositoryFactory,
  Filter,
  AnyObject,
  DeepPartial,
  Where,
  Count,
  HasManyRepositoryFactory,
} from '@loopback/repository';
import {
  Service,
  ServiceRelations,
  Page,
  Currency,
  Posts,
  Tour,
  Stay,
  ServiceWithRelations,
  StaySpecialDayPrice,
  StayOffDay,
  ServiceReview,
} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {PageRepository} from './page.repository';
import {CurrencyRepository} from './currency.repository';
import {PostsRepository} from './posts.repository';
import moment from 'moment';
import {TourRepository} from './tour.repository';
import {StayRepository} from './stay.repository';
import {ServiceFlagEnum} from '../configs/service-constant';
import dayjs = require('dayjs');
import {StaySpecialDayPriceRepository} from './stay-special-day-price.repository';
import {StayOffDayRepository} from './stay-off-day.repository';
import {ServiceReviewRepository} from './service-review.repository';

export class ServiceRepository extends DefaultCrudRepository<Service, typeof Service.prototype.id, ServiceRelations> {
  public readonly page: BelongsToAccessor<Page, typeof Service.prototype.id>;
  public readonly currency: BelongsToAccessor<Currency, typeof Service.prototype.id>;
  public readonly post: BelongsToAccessor<Posts, typeof Service.prototype.id>;
  public readonly tour: HasOneRepositoryFactory<Tour, typeof Service.prototype.id>;

  public readonly stay: HasOneRepositoryFactory<Stay, typeof Service.prototype.id>;
  public readonly specialDayPrices: HasManyRepositoryFactory<StaySpecialDayPrice, typeof Service.prototype.id>;
  public readonly offDays: HasManyRepositoryFactory<StayOffDay, typeof Service.prototype.id>;
  public readonly serviceReview: HasManyRepositoryFactory<ServiceReview, typeof Service.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,
    @repository.getter('CurrencyRepository')
    protected currencyRepositoryGetter: Getter<CurrencyRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('TourRepository')
    protected tourRepositoryGetter: Getter<TourRepository>,
    @repository.getter('StayRepository')
    protected stayRepositoryGetter: Getter<StayRepository>,
    @repository.getter('StaySpecialDayPriceRepository')
    protected staySpecialDayPriceRepositoryGetter: Getter<StaySpecialDayPriceRepository>,
    @repository.getter('StayOffDayRepository')
    protected stayOffDayRepositoryGetter: Getter<StayOffDayRepository>,
    @repository.getter('ServiceReviewRepository')
    protected serviceReviewRepositoryGetter: Getter<ServiceReviewRepository>,
  ) {
    super(Service, dataSource);
    this.stay = this.createHasOneRepositoryFactoryFor('stay', stayRepositoryGetter);
    this.registerInclusionResolver('stay', this.stay.inclusionResolver);

    // include page
    this.page = this.createBelongsToAccessorFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);

    // include currency
    this.currency = this.createBelongsToAccessorFor('currency', currencyRepositoryGetter);
    this.registerInclusionResolver('currency', this.currency.inclusionResolver);

    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);

    this.tour = this.createHasOneRepositoryFactoryFor('tour', tourRepositoryGetter);
    this.registerInclusionResolver('tour', this.tour.inclusionResolver);

    this.specialDayPrices = this.createHasManyRepositoryFactoryFor(
      'specialDayPrices',
      staySpecialDayPriceRepositoryGetter,
    );
    this.registerInclusionResolver('specialDayPrices', this.specialDayPrices.inclusionResolver);

    this.offDays = this.createHasManyRepositoryFactoryFor('offDays', stayOffDayRepositoryGetter);
    this.registerInclusionResolver('offDays', this.offDays.inclusionResolver);

    this.serviceReview = this.createHasManyRepositoryFactoryFor('serviceReview', serviceReviewRepositoryGetter);
    this.registerInclusionResolver('serviceReview', this.serviceReview.inclusionResolver);
  }

  create(
    entity: Partial<Service> | {[P in keyof Service]?: DeepPartial<Service[P]>} | Service,
    options?: AnyObject,
  ): Promise<Service> {
    const flag = entity.flag || 0;
    const flags = [ServiceFlagEnum.normal, ServiceFlagEnum.new, ServiceFlagEnum.bestSeller] as number[];
    return super.create(
      {
        ...entity,
        flag: flags.includes(flag) ? flag : ServiceFlagEnum.normal,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof Service.prototype.id,
    data: Partial<Service> | {[P in keyof Service]?: DeepPartial<Service[P]>} | Service,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  find(filter?: Filter<Service>, options?: AnyObject): Promise<(Service & ServiceRelations)[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
        },
      },
      options,
    );
  }

  count(where?: Where<Service>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  deleteById(id: typeof Service.prototype.id, options?: AnyObject): Promise<void> {
    return this.updateById(id, {
      deletedAt: dayjs().toISOString(),
    });
  }

  findOne(filter?: Filter<Service>, options?: AnyObject): Promise<(Service & ServiceWithRelations) | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
        },
      },
      options,
    );
  }

  findDelete(filter?: Filter<Service>, options?: AnyObject): Promise<(Service & ServiceRelations)[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
        },
      },
      options,
    );
  }
}
