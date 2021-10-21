import {AnyObject, Count, DefaultCrudRepository, Filter, Where} from '@loopback/repository';
import {AccommodationType, AccommodationTypeRelations, AccommodationTypeWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';
import moment = require('moment');

export class AccommodationTypeRepository extends DefaultCrudRepository<
  AccommodationType,
  typeof AccommodationType.prototype.id,
  AccommodationTypeRelations
> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(AccommodationType, dataSource);
  }

  deleteById(id: typeof AccommodationType.prototype.id, options?: AnyObject): Promise<void> {
    return super.updateById(id, {
      deletedAt: moment().utc().toISOString(),
    });
  }

  find(filter?: Filter<AccommodationType>, options?: AnyObject): Promise<AccommodationTypeWithRelations[]> {
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

  findOne(filter?: Filter<AccommodationType>, options?: AnyObject): Promise<AccommodationTypeWithRelations | null> {
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

  count(where?: Where<AccommodationType>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }
}
