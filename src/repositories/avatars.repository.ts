import {Getter, inject} from '@loopback/core';
import {
  AndClause,
  AnyObject,
  BelongsToAccessor,
  Condition,
  Count,
  DataObject,
  DeepPartial,
  DefaultCrudRepository,
  OrClause,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {Avatars, AvatarsRelations, MediaContents, Profiles} from '../models';
import {MediaContentsRepository} from './media-contents.repository';
import {ProfilesRepository} from './profiles.repository';

export class AvatarsRepository extends DefaultCrudRepository<Avatars, typeof Avatars.prototype.id, AvatarsRelations> {
  public readonly profile: BelongsToAccessor<Profiles, typeof Avatars.prototype.id>;

  public readonly mediaContent: BelongsToAccessor<MediaContents, typeof Avatars.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
    @repository.getter('MediaContentsRepository')
    protected mediaContentsRepositoryGetter: Getter<MediaContentsRepository>,
  ) {
    super(Avatars, dataSource);
    this.mediaContent = this.createBelongsToAccessorFor('mediaContent', mediaContentsRepositoryGetter);
    this.registerInclusionResolver('mediaContent', this.mediaContent.inclusionResolver);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
  }

  create(
    entity: Partial<Avatars> | {[P in keyof Avatars]?: DeepPartial<Avatars[P]>} | Avatars,
    options?: AnyObject,
  ): Promise<Avatars> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  createAll(entities: DataObject<Avatars>[], options?: AnyObject): Promise<Avatars[]> {
    const newData = Array.from(entities, (item) => {
      return {
        ...item,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      };
    });
    return super.createAll(newData, options);
  }

  updateAll(
    data: Partial<Avatars> | {[P in keyof Avatars]?: DeepPartial<Avatars[P]>} | Avatars,
    where?: Condition<Avatars> | AndClause<Avatars> | OrClause<Avatars>,
    options?: AnyObject,
  ): Promise<Count> {
    return super.updateAll(
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      where,
      options,
    );
  }

  update(entity: Avatars, options?: AnyObject): Promise<void> {
    const data = new Avatars({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(data, options);
  }

  updateById(
    id: typeof Avatars.prototype.id,
    data: Partial<Avatars> | {[P in keyof Avatars]?: DeepPartial<Avatars[P]>} | Avatars,
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
