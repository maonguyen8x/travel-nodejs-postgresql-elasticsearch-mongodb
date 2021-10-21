import {Getter, inject} from '@loopback/core';
import {
  AnyObject,
  BelongsToAccessor,
  DeepPartial,
  HasManyRepositoryFactory,
  repository,
  Filter,
  FilterExcludingWhere,
  Condition,
  OrClause,
  AndClause,
  Count,
  HasOneRepositoryFactory,
  DefaultTransactionalRepository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {ElasticSearchServiceBindings} from '../keys';
import {
  Bookmark,
  Comments,
  Likes,
  Locations,
  MediaContents,
  Posts,
  PostsRelations,
  Rankings,
  Shares,
  Users,
  Page,
  Service,
  Plan,
  Activity,
  PostsWithRelations,
} from '../models';
import {ElasticSearchService} from '../services';
import {changeAlias, concatStringForElastic} from '../utils/handleString';
import {BookmarkRepository} from './bookmark.repository';
import {CommentsRepository} from './comments.repository';
import {LikesRepository} from './likes.repository';
import {LocationsRepository} from './locations.repository';
import {MediaContentsRepository} from './media-contents.repository';
import {RankingsRepository} from './rankings.repository';
import {SharesRepository} from './shares.repository';
import {UsersRepository} from './users.repository';
import {handleError} from '../utils/handleError';
import {PageRepository} from './page.repository';
import {MaterializedViewLocationsRepository} from './materialized-view-locations.repository';
import {ServiceRepository} from './service.repository';
import {PlanRepository} from './plan.repository';
import {ActivityRepository} from './activity.repository';
import dayjs from 'dayjs';
import {MEDIA_PREVIEW_TYPES_NONE, POST_ACCESS_TYPE_PUBLIC} from '../configs/post-constants';

export class PostsRepository extends DefaultTransactionalRepository<Posts, typeof Posts.prototype.id, PostsRelations> {
  public readonly creator: BelongsToAccessor<Users, typeof Posts.prototype.id>;

  public readonly likes: HasManyRepositoryFactory<Likes, typeof Posts.prototype.id>;

  public readonly location: BelongsToAccessor<Locations, typeof Posts.prototype.id>;

  public readonly rankings: HasManyRepositoryFactory<Rankings, typeof Posts.prototype.id>;

  public readonly shares: HasManyRepositoryFactory<Shares, typeof Posts.prototype.id>;

  public readonly mediaContents: HasManyRepositoryFactory<MediaContents, typeof Posts.prototype.id>;

  public readonly comments: HasManyRepositoryFactory<Comments, typeof Posts.prototype.id>;

  public readonly sourcePost: BelongsToAccessor<Posts, typeof Posts.prototype.id>;

  public readonly bookmarks: HasManyRepositoryFactory<Bookmark, typeof Posts.prototype.id>;

  public readonly page: BelongsToAccessor<Page, typeof Posts.prototype.id>;
  public readonly service: HasOneRepositoryFactory<Service, typeof Posts.prototype.id>;
  public readonly plan: BelongsToAccessor<Plan, typeof Posts.prototype.id>;

  public readonly activity: HasOneRepositoryFactory<Activity, typeof Posts.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('LikesRepository')
    protected likesRepositoryGetter: Getter<LikesRepository>,
    @repository.getter('LocationsRepository')
    protected locationsRepositoryGetter: Getter<LocationsRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @repository.getter('SharesRepository')
    protected sharesRepositoryGetter: Getter<SharesRepository>,
    @repository.getter('MediaContentsRepository')
    protected mediaContentsRepositoryGetter: Getter<MediaContentsRepository>,
    @repository.getter('CommentsRepository')
    protected commentsRepositoryGetter: Getter<CommentsRepository>,
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
    @repository(MediaContentsRepository)
    public mediaContentsRepository: MediaContentsRepository,
    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
    @repository.getter('BookmarkRepository')
    protected bookmarkRepositoryGetter: Getter<BookmarkRepository>,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,

    @repository.getter('ServiceRepository')
    protected serviceRepositoryGetter: Getter<ServiceRepository>,
    @repository.getter('PlanRepository')
    protected planRepositoryGetter: Getter<PlanRepository>,
    @repository.getter('ActivityRepository')
    protected activityRepositoryGetter: Getter<ActivityRepository>,
  ) {
    super(Posts, dataSource);
    this.activity = this.createHasOneRepositoryFactoryFor('activity', activityRepositoryGetter);
    this.registerInclusionResolver('activity', this.activity.inclusionResolver);
    this.page = this.createBelongsToAccessorFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);
    this.bookmarks = this.createHasManyRepositoryFactoryFor('bookmarks', bookmarkRepositoryGetter);
    this.registerInclusionResolver('bookmarks', this.bookmarks.inclusionResolver);
    this.sourcePost = this.createBelongsToAccessorFor('sourcePost', Getter.fromValue(this));
    this.registerInclusionResolver('sourcePost', this.sourcePost.inclusionResolver);
    this.comments = this.createHasManyRepositoryFactoryFor('comments', commentsRepositoryGetter);
    this.registerInclusionResolver('comments', this.comments.inclusionResolver);
    this.mediaContents = this.createHasManyRepositoryFactoryFor('mediaContents', mediaContentsRepositoryGetter);
    this.registerInclusionResolver('mediaContents', this.mediaContents.inclusionResolver);
    this.shares = this.createHasManyRepositoryFactoryFor('shares', sharesRepositoryGetter);
    this.registerInclusionResolver('shares', this.shares.inclusionResolver);
    this.rankings = this.createHasManyRepositoryFactoryFor('rankings', rankingsRepositoryGetter);
    this.registerInclusionResolver('rankings', this.rankings.inclusionResolver);
    this.location = this.createBelongsToAccessorFor('location', locationsRepositoryGetter);
    this.registerInclusionResolver('location', this.location.inclusionResolver);
    this.likes = this.createHasManyRepositoryFactoryFor('likes', likesRepositoryGetter);
    this.registerInclusionResolver('likes', this.likes.inclusionResolver);
    this.creator = this.createBelongsToAccessorFor('creator', usersRepositoryGetter);
    this.registerInclusionResolver('creator', this.creator.inclusionResolver);

    this.elasticService.setIndex(String(Posts.definition.name).toLowerCase());

    this.service = this.createHasOneRepositoryFactoryFor('service', serviceRepositoryGetter);
    this.registerInclusionResolver('service', this.service.inclusionResolver);

    this.plan = this.createBelongsToAccessorFor('plan', planRepositoryGetter);
    this.registerInclusionResolver('plan', this.plan.inclusionResolver);
  }

  async create(
    entity: Partial<Posts> | {[P in keyof Posts]?: DeepPartial<Posts[P]>} | Posts,
    options?: AnyObject,
  ): Promise<Posts> {
    const listUsersReceiveNotifications = entity.listUsersReceiveNotifications
      ? entity.listUsersReceiveNotifications
      : String(entity.creatorId);
    const newData = {
      createdAt: moment().utc().toISOString(),
      ...entity,
      listUsersReceiveNotifications,
    };
    if (newData.mediaContents) {
      const mediaContents = (newData.mediaContents as MediaContents[]) || [];
      const mediaContentIds = mediaContents.map((item: MediaContents) => item.id);
      const medias = await this.mediaContentsRepository.find({
        where: {id: {inq: mediaContentIds}},
      });
      newData.medias = JSON.stringify(medias);
      newData.firstMediaType = newData.mediaContents[0]?.resourceType;
    }
    delete newData.mediaContents;
    delete newData.totalLike;
    delete newData.averagePoint;
    delete newData.totalComment;
    delete newData.totalShare;
    const result = await super.create(newData, options);
    if (entity.mediaContents) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      for (const item of entity.mediaContents) {
        await this.mediaContentsRepository.updateById(item?.id, {
          postId: result.id,
        });
      }
    }
    if (result.id) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await this.updateElasticSearch(result.id);
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
    return result;
  }

  async updateById(
    id: typeof Posts.prototype.id,
    data: Partial<Posts> | {[P in keyof Posts]?: DeepPartial<Posts[P]>} | Posts,
    options?: AnyObject,
  ): Promise<void> {
    const newData = {
      ...data,
      updatedAt: moment().utc().toISOString(),
    };

    if (newData.mediaContents) {
      const mediaContents = (newData.mediaContents as MediaContents[]) || [];
      const mediaContentIds = mediaContents.map((item: MediaContents) => item.id);
      const medias = await this.mediaContentsRepository.find({
        where: {id: {inq: mediaContentIds}},
      });
      newData.medias = JSON.stringify(medias);
      newData.firstMediaType = medias?.[0]?.resourceType || MEDIA_PREVIEW_TYPES_NONE;
    }
    delete newData.mediaContents;

    await super.updateById(id, newData, options);

    if (data.mediaContents) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const mediaContentIds = Array.from(data.mediaContents, (item) => item.id);
      await this.mediaContents(id).delete({
        id: {
          nin: mediaContentIds,
        },
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      for (const item of data.mediaContents) {
        await this.mediaContentsRepository.updateById(item?.id, {
          postId: id,
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await this.updateElasticSearch(id);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
  }

  async updateElasticSearch(id?: number) {
    try {
      const esData: PostsWithRelations = await this.findById(id, {
        include: [
          {
            relation: 'location',
          },
          {
            relation: 'creator',
          },
        ],
      });
      let location = {} as AnyObject;
      let creator = {} as AnyObject;
      if (esData?.id) {
        if (esData?.locationId) {
          location = {
            ...location,
            id: esData.location?.id,
            name: changeAlias(esData.location?.name || ''),
            formatedAddress: changeAlias(esData.location?.formatedAddress || ''),
            country: changeAlias(esData.location?.country || '').trim(),
            areaLevel1: changeAlias(esData.location?.areaLevel1 || '').trim(),
            areaLevel2: changeAlias(esData.location?.areaLevel2 || ''),
            areaLevel3: changeAlias(esData.location?.areaLevel3 || ''),
            areaLevel4: changeAlias(esData.location?.areaLevel4 || ''),
            areaLevel5: changeAlias(esData.location?.areaLevel5 || ''),
          };
        } else {
          location = {
            ...location,
            id: esData.location?.id,
            name: '',
            formatedAddress: '',
            country: '',
            areaLevel1: '',
            areaLevel2: '',
            areaLevel3: '',
            areaLevel4: '',
            areaLevel5: '',
          };
        }

        if (esData?.creatorId) {
          creator = {
            ...esData?.creator,
          };
        }
        esData.content = changeAlias(esData?.content || '');
        const result = {
          location: location,
          creator: creator,
          id: esData.id,
          content: esData.content,
          postType: esData.postType,
          accessType: esData.accessType,
          isPublicLocation: esData.isPublicLocation,
          isPublicPlan: esData.isPublicPlan,
          averagePoint: Math.round(Number(esData.averagePoint)),
          totalLike: esData.totalLike,
          totalRanking: esData.totalRanking,
          totalShare: esData.totalShare,
          totalComment: esData.totalComment,
          createdAt: esData.createdAt,
          deletedAt: esData.deletedAt,
          blockedAt: esData.blockedAt,
          creatorId: esData.creatorId,
          locationId: esData.locationId,
          sourcePostId: esData.sourcePostId,
          pageId: esData.pageId,
          status: esData.status,
          showOnProfile: esData.showOnProfile,
          firstMediaType: esData.firstMediaType,
          search: changeAlias(
            concatStringForElastic(esData.id, esData.content, location?.name, location?.address, creator?.name),
          ),
        };
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.elasticService.updateById(result, id);
      }
    } catch (e) {
      handleError(e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assign(obj: AnyObject, keyPath: string[], value: any) {
    const lastKeyIndex = keyPath.length - 1;
    for (let i = 0; i < lastKeyIndex; ++i) {
      const key = keyPath[i];
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    obj[keyPath[lastKeyIndex]] = value;
  }

  count(where?: Condition<Posts> | AndClause<Posts> | OrClause<Posts>, options?: AnyObject): Promise<Count> {
    return super.count(
      {
        ...where,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        deletedAt: null,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        blockedAt: null,
      },
      options,
    );
  }

  find(filter?: Filter<Posts>, options?: AnyObject): Promise<(Posts & PostsRelations)[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          blockedAt: null,
        },
      },
      options,
    );
  }

  findOne(filter?: Filter<Posts>, options?: AnyObject): Promise<(Posts & PostsRelations) | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          deletedAt: null,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          blockedAt: null,
        },
      },
      options,
    );
  }

  findById(
    id: typeof Posts.prototype.id,
    filter?: FilterExcludingWhere<Posts>,
    options?: AnyObject,
  ): Promise<Posts & PostsRelations> {
    return super.findById(
      id,
      {
        ...filter,
      },
      options,
    );
  }

  async deleteById(id: typeof Posts.prototype.id, options?: AnyObject): Promise<void> {
    if (id) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.elasticService.deleteById(id);
      return super.updateById(id, {
        deletedAt: dayjs().toISOString(),
      });
    }
  }

  async isPublishedWithLocation(userId: number, locationId: number): Promise<boolean> {
    try {
      if (userId && locationId) {
        const exist = await this.findOne({
          where: {
            creatorId: userId,
            locationId,
            accessType: POST_ACCESS_TYPE_PUBLIC,
            isPublicLocation: true,
          },
        });
        return Boolean(exist);
      }
      return false;
    } catch (e) {
      return handleError(e);
    }
  }

  async replaceById(
    id: typeof Posts.prototype.id,
    data: Partial<Posts> | {[P in keyof Posts]?: DeepPartial<Posts[P]>} | Posts,
    options?: AnyObject,
  ): Promise<void> {
    const result = await super.replaceById(id, data, options);
    await this.updateElasticSearch(id);
    return result;
  }
}
