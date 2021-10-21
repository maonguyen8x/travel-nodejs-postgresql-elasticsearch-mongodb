import {
  AnyObject,
  BelongsToAccessor,
  Count,
  DeepPartial,
  DefaultCrudRepository,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {Service, StaySpecialDayPrice, StaySpecialDayPriceRelations, StaySpecialDayPriceWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {Getter, inject} from '@loopback/core';
import {ServiceRepository} from './service.repository';
import dayjs from 'dayjs';

export class StaySpecialDayPriceRepository extends DefaultCrudRepository<
  StaySpecialDayPrice,
  typeof StaySpecialDayPrice.prototype.id,
  StaySpecialDayPriceRelations
> {
  public readonly service: BelongsToAccessor<Service, typeof StaySpecialDayPrice.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ServiceRepository')
    protected serviceRepositoryGetter: Getter<ServiceRepository>,
  ) {
    super(StaySpecialDayPrice, dataSource);

    this.service = this.createBelongsToAccessorFor('service', serviceRepositoryGetter);
    this.registerInclusionResolver('service', this.service.inclusionResolver);
  }

  create(
    data:
      | Partial<StaySpecialDayPrice>
      | {[P in keyof StaySpecialDayPrice]?: DeepPartial<StaySpecialDayPrice[P]>}
      | StaySpecialDayPrice,
    options?: AnyObject,
  ): Promise<StaySpecialDayPrice> {
    data.date = dayjs.utc(data.date).startOf('day').toISOString();
    return super.create(data, options);
  }

  async updateById(
    id: typeof StaySpecialDayPrice.prototype.id,
    data:
      | Partial<StaySpecialDayPrice>
      | {[P in keyof StaySpecialDayPrice]?: DeepPartial<StaySpecialDayPrice[P]>}
      | StaySpecialDayPrice,
    options?: AnyObject,
  ): Promise<void> {
    if (!id) return;

    return super.updateById(
      id,
      {
        ...data,
        updatedAt: dayjs().toISOString(),
      },
      options,
    );
  }

  find(
    filter?: Filter<StaySpecialDayPrice>,
    options?: AnyObject,
  ): Promise<(StaySpecialDayPrice & StaySpecialDayPriceRelations)[]> {
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

  count(where?: Where<StaySpecialDayPrice>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  findOne(
    filter?: Filter<StaySpecialDayPrice>,
    options?: AnyObject,
  ): Promise<(StaySpecialDayPrice & StaySpecialDayPriceWithRelations) | null> {
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
}
