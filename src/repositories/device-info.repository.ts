import {DefaultCrudRepository, repository, BelongsToAccessor, DeepPartial, AnyObject} from '@loopback/repository';
import {DeviceToken, DeviceTokenRelations, Users} from '../models';
import {MongodbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {UsersRepository} from './users.repository';
import moment from 'moment';

export class DeviceTokenRepository extends DefaultCrudRepository<
  DeviceToken,
  typeof DeviceToken.prototype.id,
  DeviceTokenRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof DeviceToken.prototype.id>;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(DeviceToken, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<DeviceToken> | {[P in keyof DeviceToken]?: DeepPartial<DeviceToken[P]>} | DeviceToken,
    options?: AnyObject,
  ): Promise<DeviceToken> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof DeviceToken.prototype.id,
    data: Partial<DeviceToken> | {[P in keyof DeviceToken]?: DeepPartial<DeviceToken[P]>} | DeviceToken,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
