import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {Booking, Posts, Service, ServiceReview, ServiceReviewRelations, Users} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {UsersRepository} from './users.repository';
import {BookingRepository} from './booking.repository';
import {ServiceRepository} from './service.repository';
import {PostsRepository} from './posts.repository';

export class ServiceReviewRepository extends DefaultCrudRepository<
  ServiceReview,
  typeof ServiceReview.prototype.id,
  ServiceReviewRelations
> {
  public readonly createdBy: BelongsToAccessor<Users, typeof ServiceReview.prototype.id>;
  public readonly booking: BelongsToAccessor<Booking, typeof ServiceReview.prototype.id>;
  public readonly service: BelongsToAccessor<Service, typeof ServiceReview.prototype.id>;
  public readonly post: BelongsToAccessor<Posts, typeof ServiceReview.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('BookingRepository')
    protected bookingRepositoryGetter: Getter<BookingRepository>,
    @repository.getter('ServiceRepository')
    protected serviceRepositoryGetter: Getter<ServiceRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
  ) {
    super(ServiceReview, dataSource);

    // include user
    this.createdBy = this.createBelongsToAccessorFor('createdBy', usersRepositoryGetter);
    this.registerInclusionResolver('createdBy', this.createdBy.inclusionResolver);

    // include booking
    this.booking = this.createBelongsToAccessorFor('booking', bookingRepositoryGetter);
    this.registerInclusionResolver('booking', this.booking.inclusionResolver);

    // include service
    this.service = this.createBelongsToAccessorFor('service', serviceRepositoryGetter);
    this.registerInclusionResolver('service', this.service.inclusionResolver);

    // include post
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
  }
}
