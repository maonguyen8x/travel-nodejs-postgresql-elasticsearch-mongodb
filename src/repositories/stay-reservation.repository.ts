import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {Booking, Currency, Stay, StayReservation, StayReservationRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {StayRepository} from './stay.repository';
import {CurrencyRepository} from './currency.repository';
import {BookingRepository} from './booking.repository';

export class StayReservationRepository extends DefaultCrudRepository<
  StayReservation,
  typeof StayReservation.prototype.id,
  StayReservationRelations
> {
  public readonly stay: BelongsToAccessor<Stay, typeof StayReservation.prototype.id>;
  public readonly currency: BelongsToAccessor<Currency, typeof StayReservation.prototype.id>;
  public readonly booking: BelongsToAccessor<Booking, typeof StayReservation.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,

    @repository.getter('StayRepository')
    protected stayRepositoryGetter: Getter<StayRepository>,
    @repository.getter('CurrencyRepository')
    protected currencyRepositoryGetter: Getter<CurrencyRepository>,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
  ) {
    super(StayReservation, dataSource);

    this.stay = this.createBelongsToAccessorFor('stay', stayRepositoryGetter);
    this.registerInclusionResolver('stay', this.stay.inclusionResolver);
    // include currency
    this.currency = this.createBelongsToAccessorFor('currency', currencyRepositoryGetter);
    this.registerInclusionResolver('currency', this.currency.inclusionResolver);

    // include booking
    this.booking = this.createBelongsToAccessorFor('booking', bookingRepositoryGetter);
    this.registerInclusionResolver('booking', this.booking.inclusionResolver);
  }
}
