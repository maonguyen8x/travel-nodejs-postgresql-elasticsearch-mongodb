import {DefaultCrudRepository, BelongsToAccessor, repository, HasOneRepositoryFactory} from '@loopback/repository';
import {
  Booking,
  BookingRelations,
  TourReservation,
  Users,
  Currency,
  Page,
  Service,
  StayReservation,
  ServiceReview,
} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {TourReservationRepository} from './tour-reservation.repository';
import {UsersRepository} from './users.repository';
import {CurrencyRepository} from './currency.repository';
import {PageRepository} from './page.repository';
import {ServiceRepository} from './service.repository';
import {StayReservationRepository} from './stay-reservation.repository';
import {ServiceReviewRepository} from './service-review.repository';

export class BookingRepository extends DefaultCrudRepository<Booking, typeof Booking.prototype.id, BookingRelations> {
  public readonly stayReservation: HasOneRepositoryFactory<StayReservation, typeof Booking.prototype.id>;
  public readonly tourReservation: HasOneRepositoryFactory<TourReservation, typeof Booking.prototype.id>;
  public readonly serviceReviewItem: HasOneRepositoryFactory<ServiceReview, typeof Booking.prototype.id>;
  public readonly createdBy: BelongsToAccessor<Users, typeof Booking.prototype.id>;
  public readonly currency: BelongsToAccessor<Currency, typeof Booking.prototype.id>;
  public readonly page: BelongsToAccessor<Page, typeof Booking.prototype.id>;
  public readonly service: BelongsToAccessor<Service, typeof Booking.prototype.id>;
  public readonly actBy: BelongsToAccessor<Users, typeof Booking.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,

    @repository.getter('StayReservationRepository')
    protected stayReservationRepositoryGetter: Getter<StayReservationRepository>,
    @repository.getter('TourReservationRepository')
    protected tourReservationRepositoryGetter: Getter<TourReservationRepository>,
    @repository.getter('ServiceReviewRepository')
    protected serviceReviewRepositoryGetter: Getter<ServiceReviewRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('CurrencyRepository')
    protected currencyRepositoryGetter: Getter<CurrencyRepository>,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,
    @repository.getter('ServiceRepository')
    protected serviceRepositoryGetter: Getter<ServiceRepository>,
  ) {
    super(Booking, dataSource);

    // include stay reservation
    this.stayReservation = this.createHasOneRepositoryFactoryFor('stayReservation', stayReservationRepositoryGetter);
    this.registerInclusionResolver('stayReservation', this.stayReservation.inclusionResolver);

    // include tour reservation
    this.tourReservation = this.createHasOneRepositoryFactoryFor('tourReservation', tourReservationRepositoryGetter);
    this.registerInclusionResolver('tourReservation', this.tourReservation.inclusionResolver);

    // include tour serviceReviewItem
    this.serviceReviewItem = this.createHasOneRepositoryFactoryFor('serviceReviewItem', serviceReviewRepositoryGetter);
    this.registerInclusionResolver('serviceReviewItem', this.serviceReviewItem.inclusionResolver);

    // include user
    this.createdBy = this.createBelongsToAccessorFor('createdBy', usersRepositoryGetter);
    this.registerInclusionResolver('createdBy', this.createdBy.inclusionResolver);

    // include currency
    this.currency = this.createBelongsToAccessorFor('currency', currencyRepositoryGetter);
    this.registerInclusionResolver('currency', this.currency.inclusionResolver);

    // include page
    this.page = this.createBelongsToAccessorFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);

    // include service
    this.service = this.createBelongsToAccessorFor('service', serviceRepositoryGetter);
    this.registerInclusionResolver('service', this.service.inclusionResolver);

    // include actBy
    this.actBy = this.createBelongsToAccessorFor('actBy', usersRepositoryGetter);
    this.registerInclusionResolver('actBy', this.actBy.inclusionResolver);
  }
}
