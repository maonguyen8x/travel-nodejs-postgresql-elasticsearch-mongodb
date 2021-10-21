import {
  DefaultCrudRepository,
  repository,
  HasManyRepositoryFactory,
  BelongsToAccessor,
  DeepPartial,
  AnyObject,
  Filter,
} from '@loopback/repository';
import {Tour, TourRelations, TimeToOrganizeTour, Locations, Service, TourWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {TimeToOrganizeTourRepository} from './time-to-organize-tour.repository';
import {LocationsRepository} from './locations.repository';
import {ServiceRepository} from './service.repository';
import dayjs = require('dayjs');

export class TourRepository extends DefaultCrudRepository<Tour, typeof Tour.prototype.id, TourRelations> {
  public readonly timeToOrganizeTours: HasManyRepositoryFactory<TimeToOrganizeTour, typeof Tour.prototype.id>;

  public readonly location: BelongsToAccessor<Locations, typeof Tour.prototype.id>;

  public readonly service: BelongsToAccessor<Service, typeof Tour.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('TimeToOrganizeTourRepository')
    protected timeToOrganizeTourRepositoryGetter: Getter<TimeToOrganizeTourRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @repository.getter('ServiceRepository')
    protected serviceRepositoryGetter: Getter<ServiceRepository>,
  ) {
    super(Tour, dataSource);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);

    this.timeToOrganizeTours = this.createHasManyRepositoryFactoryFor(
      'timeToOrganizeTours',
      timeToOrganizeTourRepositoryGetter,
    );
    this.registerInclusionResolver('timeToOrganizeTours', this.timeToOrganizeTours.inclusionResolver);

    this.service = this.createBelongsToAccessorFor('service', serviceRepositoryGetter);
    this.registerInclusionResolver('service', this.service.inclusionResolver);
  }

  // async validateCreate(data: ServiceTourBodyPostRequest) {
  //   // eslint-disable-next-line no-useless-catch
  //   try {
  //     const { vehicleServices, includeServices } = data;
  //
  //     // eslint-disable-next-line no-unused-expressions
  //     vehicleServices && this.validateServiceCodes(vehicleServices, VehicleIncludeCodes);
  //     // eslint-disable-next-line no-unused-expressions
  //     includeServices && this.validateServiceCodes(includeServices, ServiceIncludeCodes);
  //
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  //
  // validateServiceCodes(services: string[], enumServiceCode: string[]): void {
  //   for (let i = 0; i < services.length; i++) {
  //     const service = services[i];
  //
  //     if (!Object.values(enumServiceCode).includes(service)) {
  //       throw new HttpErrors.BadRequest(
  //         `${ErrorMessage[ErrorCode.BAD_REQUEST]}: ${service}`
  //       );
  //     }
  //   }
  // }

  create(
    entity: Partial<Tour> | {[P in keyof Tour]?: DeepPartial<Tour[P]>} | Tour,
    options?: AnyObject,
  ): Promise<Tour> {
    return super.create(
      {
        ...entity,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof Tour.prototype.id,
    data: Partial<Tour> | {[P in keyof Tour]?: DeepPartial<Tour[P]>} | Tour,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: dayjs().toISOString(),
      },
      options,
    );
  }

  deleteById(id: typeof Tour.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(id, {
      deletedAt: dayjs().toISOString(),
    });
  }

  findOne(filter?: Filter<Tour>, options?: AnyObject): Promise<(Tour & TourWithRelations) | null> {
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

  find(filter?: Filter<Tour>, options?: AnyObject): Promise<(Tour & TourWithRelations)[]> {
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
}
