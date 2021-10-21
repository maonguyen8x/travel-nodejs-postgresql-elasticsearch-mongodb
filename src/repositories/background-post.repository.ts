import {DefaultCrudRepository, Filter, AnyObject, Condition, AndClause, OrClause, Count} from '@loopback/repository';
import {BackgroundPost, BackgroundPostRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class BackgroundPostRepository extends DefaultCrudRepository<
  BackgroundPost,
  typeof BackgroundPost.prototype.id,
  BackgroundPostRelations
> {
  constructor(@inject('datasources.postgresql') dataSource: PostgresqlDataSource) {
    super(BackgroundPost, dataSource);
  }

  find(filter?: Filter<BackgroundPost>, options?: AnyObject): Promise<(BackgroundPost & BackgroundPostRelations)[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
          isActive: true,
        },
      },
      options,
    );
  }

  findOne(
    filter?: Filter<BackgroundPost>,
    options?: AnyObject,
  ): Promise<(BackgroundPost & BackgroundPostRelations) | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
          isActive: true,
        },
      },
      options,
    );
  }

  count(
    where?: Condition<BackgroundPost> | AndClause<BackgroundPost> | OrClause<BackgroundPost>,
    options?: AnyObject,
  ): Promise<Count> {
    return super.count(
      {
        ...where,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
        isActive: true,
      },
      options,
    );
  }
}
