import {
  DefaultTransactionalRepository,
  repository,
  BelongsToAccessor,
  AnyObject,
  HasManyRepositoryFactory,
  DeepPartial, Filter, Where, Count,
} from '@loopback/repository';
import {
  Activity,
  ActivityRelations,
  Locations,
  Posts,
  Users,
  Currency,
  ActivityParticipant,
  ActivityInvitee,
  ActivityWithRelations,
} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {LocationsRepository} from './locations.repository';
import {PostsRepository} from './posts.repository';
import {UsersRepository} from './users.repository';
import {CurrencyRepository} from './currency.repository';
import {ActivityParticipantRepository} from './activity-participant.repository';
import {ActivityInviteeRepository} from './activity-invitee.repository';
import moment from 'moment';
import {ElasticSearchServiceBindings} from '../keys';
import {ElasticSearchService} from '../services';
import {handleError} from '../utils/handleError';
import {CreateActivityRequestInterface} from '../controllers/activities/activity.constant';

export class ActivityRepository extends DefaultTransactionalRepository<
  Activity,
  typeof Activity.prototype.id,
  ActivityRelations
> {
  public readonly location: BelongsToAccessor<Locations, typeof Activity.prototype.id>;

  public readonly post: BelongsToAccessor<Posts, typeof Activity.prototype.id>;

  public readonly createdBy: BelongsToAccessor<Users, typeof Activity.prototype.id>;

  public readonly currency: BelongsToAccessor<Currency, typeof Activity.prototype.id>;

  public readonly activityParticipants: HasManyRepositoryFactory<ActivityParticipant, typeof Activity.prototype.id>;

  public readonly activityInvitees: HasManyRepositoryFactory<ActivityInvitee, typeof Activity.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('CurrencyRepository')
    protected currencyRepositoryGetter: Getter<CurrencyRepository>,
    @repository.getter('ActivityParticipantRepository')
    protected activityParticipantRepositoryGetter: Getter<ActivityParticipantRepository>,
    @repository.getter('ActivityInviteeRepository')
    protected activityInviteeRepositoryGetter: Getter<ActivityInviteeRepository>,
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(ActivityParticipantRepository)
    public activityParticipantRepository: ActivityParticipantRepository,
  ) {
    super(Activity, dataSource);
    this.activityParticipants = this.createHasManyRepositoryFactoryFor(
      'activityParticipants',
      activityParticipantRepositoryGetter,
    );
    this.registerInclusionResolver('activityParticipants', this.activityParticipants.inclusionResolver);
    this.activityInvitees = this.createHasManyRepositoryFactoryFor('activityInvitees', activityInviteeRepositoryGetter);
    this.registerInclusionResolver('activityInvitees', this.activityInvitees.inclusionResolver);
    this.currency = this.createBelongsToAccessorFor('currency', currencyRepositoryGetter);
    this.registerInclusionResolver('currency', this.currency.inclusionResolver);
    this.createdBy = this.createBelongsToAccessorFor('createdBy', usersRepositoryGetter);
    this.registerInclusionResolver('createdBy', this.createdBy.inclusionResolver);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);

    this.elasticService.setIndex(String(Activity.definition.name).toLowerCase());
  }

  async deleteById(id: typeof Activity.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(id, {
      deletedAt: moment().utc().toISOString(),
    });
  }

  async create(
    entity:
      | Partial<CreateActivityRequestInterface>
      | {[P in keyof CreateActivityRequestInterface]?: DeepPartial<CreateActivityRequestInterface[P]>}
      | CreateActivityRequestInterface,
    options?: AnyObject,
  ): Promise<Activity> {
    try {
      return await super.create(
        {
          ...entity,
          createdAt: moment().utc().toISOString(),
          updatedAt: moment().utc().toISOString(),
        },
        options,
      );
    } catch (e) {
      return handleError(e);
    }
  }

  async updateById(
    id: typeof Activity.prototype.id,
    data:
      | Partial<CreateActivityRequestInterface>
      | {[P in keyof CreateActivityRequestInterface]?: DeepPartial<CreateActivityRequestInterface[P]>}
      | CreateActivityRequestInterface,
    options?: AnyObject,
  ): Promise<void> {
    await super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  find(filter?: Filter<Activity>, options?: AnyObject): Promise<ActivityWithRelations[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
          blockedAt: {eq: null},
        },
      },
      options,
    );
  }

  count(where?: Where<Activity>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
      blockedAt: {eq: null},
    });
  }

  findOne(filter?: Filter<Activity>, options?: AnyObject): Promise<ActivityWithRelations | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
          blockedAt: {eq: null},
        },
      },
      options,
    );
  }


}
