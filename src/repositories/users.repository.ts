import {Getter, inject} from '@loopback/core';
import {
  AnyObject,
  DeepPartial,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
  repository,
  Filter,
  FilterExcludingWhere,
  Condition,
  AndClause,
  OrClause,
  Count,
} from '@loopback/repository';
import moment from 'moment';
import {concatStringForElastic} from '../utils/handleString';
import {PostgresqlDataSource} from '../datasources';
import {
  Bookmark,
  ChildComment,
  Comments,
  Follow,
  Interesting,
  Likes,
  MediaContents,
  MyLocations,
  Posts,
  Profiles,
  Rankings,
  Shares,
  Usercredentials,
  UserEmail,
  Users,
  UsersRelations,
  Notification,
  DeviceToken,
  Plan,
  Page,
  UsersWithRelations,
} from '../models';
import {BookmarkRepository} from './bookmark.repository';
import {ChildCommentRepository} from './child-comment.repository';
import {CommentsRepository} from './comments.repository';
import {FollowRepository} from './follow.repository';
import {InterestingRepository} from './interesting.repository';
import {LikesRepository} from './likes.repository';
import {MediaContentsRepository} from './media-contents.repository';
import {MyLocationsRepository} from './my-locations.repository';
import {PostsRepository} from './posts.repository';
import {ProfilesRepository} from './profiles.repository';
import {RankingsRepository} from './rankings.repository';
import {SharesRepository} from './shares.repository';
import {UserEmailRepository} from './user-email.repository';
import {UsercredentialsRepository} from './usercredentials.repository';
import {NotificationRepository} from './notification.repository';
import {ElasticSearchServiceBindings} from '../keys';
import {ElasticSearchService} from '../services';
import {DeviceTokenRepository} from './device-info.repository';
import {PlanRepository} from './plan.repository';
import {changeAlias} from '../utils/handleString';
import {handleError} from '../utils/handleError';
import {PageRepository} from './page.repository';
import {UserWithRelatedPageId} from '../controllers/user/user-interface';

export type Credentials = {
  email: string;
  password: string;
};
export class UsersRepository extends DefaultCrudRepository<Users, typeof Users.prototype.id, UsersRelations> {
  public readonly usercredentials: HasOneRepositoryFactory<Usercredentials, typeof Users.prototype.id>;

  public readonly likes: HasManyRepositoryFactory<Likes, typeof Users.prototype.id>;

  public readonly posts: HasManyRepositoryFactory<Posts, typeof Users.prototype.id>;

  public readonly rankings: HasManyRepositoryFactory<Rankings, typeof Users.prototype.id>;

  public readonly shares: HasManyRepositoryFactory<Shares, typeof Users.prototype.id>;

  public readonly profiles: HasOneRepositoryFactory<Profiles, typeof Users.prototype.id>;

  public readonly mediaContents: HasManyRepositoryFactory<MediaContents, typeof Users.prototype.id>;

  public readonly comments: HasManyRepositoryFactory<Comments, typeof Users.prototype.id>;

  public readonly email: HasOneRepositoryFactory<UserEmail, typeof Users.prototype.id>;

  public readonly interestings: HasManyRepositoryFactory<Interesting, typeof Users.prototype.id>;

  public readonly childComments: HasManyRepositoryFactory<ChildComment, typeof Users.prototype.id>;

  public readonly bookmarks: HasManyRepositoryFactory<Bookmark, typeof Users.prototype.id>;

  public readonly follows: HasManyRepositoryFactory<Follow, typeof Users.prototype.id>;

  public readonly following: HasManyRepositoryFactory<Follow, typeof Users.prototype.id>;

  public readonly myLocations: HasManyRepositoryFactory<MyLocations, typeof Users.prototype.id>;

  public readonly page: HasOneRepositoryFactory<Page, typeof Users.prototype.id>;

  public readonly notifications: HasManyRepositoryFactory<Notification, typeof Users.prototype.id>;

  public readonly deviceInfos: HasManyRepositoryFactory<DeviceToken, typeof Users.prototype.id>;

  public readonly plans: HasManyRepositoryFactory<Plan, typeof Users.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UsercredentialsRepository>,
    @repository.getter('UsercredentialsRepository')
    protected usercredentialsRepositoryGetter: Getter<UsercredentialsRepository>,
    @repository.getter('LikesRepository')
    protected likesRepositoryGetter: Getter<LikesRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @repository.getter('SharesRepository')
    protected sharesRepositoryGetter: Getter<SharesRepository>,
    @repository.getter('ProfilesRepository')
    protected profilesRepositoryGetter: Getter<ProfilesRepository>,
    @repository.getter('MediaContentsRepository')
    protected mediaContentsRepositoryGetter: Getter<MediaContentsRepository>,
    @repository.getter('CommentsRepository')
    protected commentsRepositoryGetter: Getter<CommentsRepository>,
    @repository.getter('UserEmailRepository')
    protected userEmailRepositoryGetter: Getter<UserEmailRepository>,
    @repository.getter('InterestingRepository')
    protected interestingRepositoryGetter: Getter<InterestingRepository>,
    @repository.getter('ChildCommentRepository')
    protected childCommentRepositoryGetter: Getter<ChildCommentRepository>,
    @repository.getter('BookmarkRepository')
    protected bookmarkRepositoryGetter: Getter<BookmarkRepository>,
    @repository.getter('FollowRepository')
    protected followRepositoryGetter: Getter<FollowRepository>,
    @repository.getter('MyLocationsRepository')
    protected myLocationsRepositoryGetter: Getter<MyLocationsRepository>,
    @repository.getter('NotificationRepository')
    protected notificationRepositoryGetter: Getter<NotificationRepository>,

    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
    @repository.getter('DeviceTokenRepository')
    protected deviceInfoRepositoryGetter: Getter<DeviceTokenRepository>,
    @repository.getter('PlanRepository')
    protected planRepositoryGetter: Getter<PlanRepository>,
  ) {
    super(Users, dataSource);
    this.plans = this.createHasManyRepositoryFactoryFor('plans', planRepositoryGetter);
    this.registerInclusionResolver('plans', this.plans.inclusionResolver);
    this.deviceInfos = this.createHasManyRepositoryFactoryFor('deviceInfos', deviceInfoRepositoryGetter);
    this.registerInclusionResolver('deviceInfos', this.deviceInfos.inclusionResolver);
    this.notifications = this.createHasManyRepositoryFactoryFor('notifications', notificationRepositoryGetter);
    this.registerInclusionResolver('notifications', this.notifications.inclusionResolver);
    this.myLocations = this.createHasManyRepositoryFactoryFor('myLocations', myLocationsRepositoryGetter);
    this.registerInclusionResolver('myLocations', this.myLocations.inclusionResolver);
    this.following = this.createHasManyRepositoryFactoryFor('following', followRepositoryGetter);
    this.registerInclusionResolver('following', this.following.inclusionResolver);
    this.follows = this.createHasManyRepositoryFactoryFor('follows', followRepositoryGetter);
    this.registerInclusionResolver('follows', this.follows.inclusionResolver);
    this.bookmarks = this.createHasManyRepositoryFactoryFor('bookmarks', bookmarkRepositoryGetter);
    this.registerInclusionResolver('bookmarks', this.bookmarks.inclusionResolver);
    this.childComments = this.createHasManyRepositoryFactoryFor('childComments', childCommentRepositoryGetter);
    this.registerInclusionResolver('childComments', this.childComments.inclusionResolver);
    this.interestings = this.createHasManyRepositoryFactoryFor('interestings', interestingRepositoryGetter);
    this.registerInclusionResolver('interestings', this.interestings.inclusionResolver);
    this.email = this.createHasOneRepositoryFactoryFor('email', userEmailRepositoryGetter);
    this.registerInclusionResolver('email', this.email.inclusionResolver);
    this.comments = this.createHasManyRepositoryFactoryFor('comments', commentsRepositoryGetter);
    this.registerInclusionResolver('comments', this.comments.inclusionResolver);
    this.mediaContents = this.createHasManyRepositoryFactoryFor('mediaContents', mediaContentsRepositoryGetter);
    this.registerInclusionResolver('mediaContents', this.mediaContents.inclusionResolver);
    this.profiles = this.createHasOneRepositoryFactoryFor('profiles', profilesRepositoryGetter);
    this.registerInclusionResolver('profiles', this.profiles.inclusionResolver);
    this.shares = this.createHasManyRepositoryFactoryFor('shares', sharesRepositoryGetter);
    this.registerInclusionResolver('shares', this.shares.inclusionResolver);
    this.rankings = this.createHasManyRepositoryFactoryFor('rankings', rankingsRepositoryGetter);
    this.registerInclusionResolver('rankings', this.rankings.inclusionResolver);
    this.posts = this.createHasManyRepositoryFactoryFor('posts', postsRepositoryGetter);
    this.registerInclusionResolver('posts', this.posts.inclusionResolver);
    this.likes = this.createHasManyRepositoryFactoryFor('likes', likesRepositoryGetter);
    this.registerInclusionResolver('likes', this.likes.inclusionResolver);
    this.usercredentials = this.createHasOneRepositoryFactoryFor('usercredentials', usercredentialsRepositoryGetter);
    this.registerInclusionResolver('usercredentials', this.usercredentials.inclusionResolver);
    this.page = this.createHasOneRepositoryFactoryFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);

    this.elasticService.setIndex(String(Users.definition.name).toLowerCase());
  }

  async findCredentials(userId: typeof Users.prototype.id): Promise<Usercredentials | undefined> {
    try {
      return await this.usercredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }

  async create(
    entity: Partial<Users> | {[P in keyof Users]?: DeepPartial<Users[P]>} | Users,
    options?: AnyObject,
  ): Promise<Users> {
    const data = {
      ...entity,
    };
    delete data.id;
    delete data.isActive;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.email;
    delete data.profiles;
    delete data.comments;
    const user = await super.create(
      {
        ...data,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
    await Promise.all([
      this.email(user.id).create({
        userId: user.id,
        ...(entity.email ? entity.email : {}),
      }),
      this.profiles(user.id).create({
        userId: user.id,
        ...(entity.profiles ? entity.profiles : {}),
      }),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.updateElastic(user.id);
    return user;
  }

  update(entity: Users, options?: AnyObject): Promise<void> {
    const data = {...entity, updatedAt: moment().utc().toISOString()};
    delete data.id;
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return super.update(data, options);
  }

  activeUser(id: number, data: AnyObject): Promise<void> {
    return super.updateById(id, data);
  }

  async updateElastic(userId?: number, data?: AnyObject, options?: AnyObject): Promise<void> {
    try {
      const user = await this.findById(
        userId,
        {
          include: [
            {
              relation: 'email',
            },
            {
              relation: 'profiles',
              scope: {
                include: [
                  {
                    relation: 'birthday',
                  },
                  {
                    relation: 'gender',
                  },
                  {
                    relation: 'address',
                  },
                  {
                    relation: 'introduce',
                  },
                  {
                    relation: 'work',
                  },
                  {
                    relation: 'website',
                  },
                  {
                    relation: 'phone',
                  },
                  {
                    relation: 'avatars',
                    scope: {
                      include: [
                        {
                          relation: 'mediaContent',
                        },
                      ],
                    },
                  },
                  {
                    relation: 'backgrounds',
                    scope: {
                      include: [
                        {
                          relation: 'mediaContent',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
        options,
      );
      await this.elasticService.updateById(
        {
          ...user,
          name: changeAlias(user.name),
          username: changeAlias(user.username),
          search: changeAlias(
            concatStringForElastic(user?.name, user?.username, user?.email?.email, user?.profiles?.phone?.phone),
          ),
          ...data,
        },
        userId,
      );
    } catch (e) {
      handleError(e);
    }
  }

  async createUser(
    entity: Partial<Users> | {[P in keyof Users]?: DeepPartial<Users[P]>} | Users,
    options?: AnyObject,
  ): Promise<Users> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  convertDataUser(user?: UsersWithRelations): UserWithRelatedPageId | null {
    if (!user) {
      return null;
    }
    return {
      ...user,
      relatedPageId: user?.page?.id,
    };
  }

  async count(where?: Condition<Users> | AndClause<Users> | OrClause<Users>, options?: AnyObject): Promise<Count> {
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

  async find(filter?: Filter<Users>, options?: AnyObject): Promise<(Users & UsersRelations)[]> {
    const result = await super.find(
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return result.map((user) => this.convertDataUser(user));
  }

  async findOne(filter?: Filter<Users>, options?: AnyObject): Promise<Users & UsersRelations> {
    const result = await super.findOne(
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return this.convertDataUser(result);
  }

  async findById(
    id: typeof Users.prototype.id,
    filter?: FilterExcludingWhere<Users>,
    options?: AnyObject,
  ): Promise<Users & UsersRelations> {
    const result = await super.findById(id, filter, options);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return this.convertDataUser(result);
  }
}
