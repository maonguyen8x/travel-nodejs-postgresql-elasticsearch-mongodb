import {
  AnyObject,
  BelongsToAccessor,
  Count,
  DeepPartial,
  DefaultCrudRepository,
  Filter,
  Where,
} from '@loopback/repository';
import {Service, StayOffDay, StayOffDayRelations, StayOffDayWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';
import dayjs from 'dayjs';

export class StayOffDayRepository extends DefaultCrudRepository<
  StayOffDay,
  typeof StayOffDay.prototype.id,
  StayOffDayRelations
> {
  public readonly service: BelongsToAccessor<Service, typeof StayOffDay.prototype.id>;

  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(StayOffDay, dataSource);
  }

  create(
    data: Partial<StayOffDay> | {[P in keyof StayOffDay]?: DeepPartial<StayOffDay[P]>} | StayOffDay,
    options?: AnyObject,
  ): Promise<StayOffDay> {
    data.date = dayjs.utc(data.date).startOf('day').toISOString();
    return super.create(data, options);
  }

  async updateById(
    id: typeof StayOffDay.prototype.id,
    data: Partial<StayOffDay> | {[P in keyof StayOffDay]?: DeepPartial<StayOffDay[P]>} | StayOffDay,
    options?: AnyObject,
  ): Promise<void> {
    if (!id) return;

    data.date && (data.date = dayjs.utc(data.date).startOf('day').toISOString());
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: dayjs().toISOString(),
      },
      options,
    );
  }

  find(filter?: Filter<StayOffDay>, options?: AnyObject): Promise<(StayOffDay & StayOffDayRelations)[]> {
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

  count(where?: Where<StayOffDay>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  findOne(filter?: Filter<StayOffDay>, options?: AnyObject): Promise<(StayOffDay & StayOffDayWithRelations) | null> {
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
