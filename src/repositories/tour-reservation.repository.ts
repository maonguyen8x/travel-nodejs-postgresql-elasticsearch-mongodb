import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {TourReservation, TourReservationRelations, Tour, Currency, Booking} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {TourRepository} from './tour.repository';
import {CurrencyRepository} from './currency.repository';
import {BookingRepository} from './booking.repository';

export class TourReservationRepository extends DefaultCrudRepository<
  TourReservation,
  typeof TourReservation.prototype.id,
  TourReservationRelations
> {
  public readonly tour: BelongsToAccessor<Tour, typeof TourReservation.prototype.id>;
  public readonly currency: BelongsToAccessor<Currency, typeof TourReservation.prototype.id>;
  public readonly booking: BelongsToAccessor<Booking, typeof TourReservation.prototype.id>;
  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('TourRepository')
    protected tourRepositoryGetter: Getter<TourRepository>,
    @repository.getter('CurrencyRepository')
    protected currencyRepositoryGetter: Getter<CurrencyRepository>,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
  ) {
    super(TourReservation, dataSource);
    this.tour = this.createBelongsToAccessorFor('tour', tourRepositoryGetter);
    this.registerInclusionResolver('tour', this.tour.inclusionResolver);
    // include currency
    this.currency = this.createBelongsToAccessorFor('currency', currencyRepositoryGetter);
    this.registerInclusionResolver('currency', this.currency.inclusionResolver);

    // include booking
    this.booking = this.createBelongsToAccessorFor('booking', bookingRepositoryGetter);
    this.registerInclusionResolver('booking', this.booking.inclusionResolver);
  }
}
