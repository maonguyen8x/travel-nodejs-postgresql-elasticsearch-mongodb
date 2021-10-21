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
import {Backgrounds, BackgroundsRelations, MediaContents, Profiles} from '../models';
import {MediaContentsRepository} from './media-contents.repository';
import {ProfilesRepository} from './profiles.repository';

export class BackgroundsRepository extends DefaultCrudRepository<
  Backgrounds,
  typeof Backgrounds.prototype.id,
  BackgroundsRelations
> {
  public readonly mediaContent: BelongsToAccessor<MediaContents, typeof Backgrounds.prototype.id>;

  public readonly profile: BelongsToAccessor<Profiles, typeof Backgrounds.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('MediaContentsRepository')
    protected mediaContentsRepositoryGetter: Getter<MediaContentsRepository>,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
  ) {
    super(Backgrounds, dataSource);
    this.profile = this.createBelongsToAccessorFor('profile', profilesRepositoryGetter);
    this.registerInclusionResolver('profile', this.profile.inclusionResolver);
    this.mediaContent = this.createBelongsToAccessorFor('mediaContent', mediaContentsRepositoryGetter);
    this.registerInclusionResolver('mediaContent', this.mediaContent.inclusionResolver);
  }

  create(
    entity: Partial<Backgrounds> | {[P in keyof Backgrounds]?: DeepPartial<Backgrounds[P]>} | Backgrounds,
    options?: AnyObject,
  ): Promise<Backgrounds> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  createAll(entities: DataObject<Backgrounds>[], options?: AnyObject): Promise<Backgrounds[]> {
    const newData = Array.from(entities, (item) => {
      return {
        ...item,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      };
    });
    return super.createAll(newData, options);
  }

  update(entity: Backgrounds, options?: AnyObject): Promise<void> {
    const data = new Backgrounds({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(data, options);
  }

  updateAll(
    data: Partial<Backgrounds> | {[P in keyof Backgrounds]?: DeepPartial<Backgrounds[P]>} | Backgrounds,
    where?: Condition<Backgrounds> | AndClause<Backgrounds> | OrClause<Backgrounds>,
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

  updateById(
    id: typeof Backgrounds.prototype.id,
    data: Partial<Backgrounds> | {[P in keyof Backgrounds]?: DeepPartial<Backgrounds[P]>} | Backgrounds,
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
