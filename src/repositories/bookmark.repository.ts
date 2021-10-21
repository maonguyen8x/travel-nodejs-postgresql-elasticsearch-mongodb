import {Getter, inject} from '@loopback/core';
import {AnyObject, BelongsToAccessor, DeepPartial, DefaultCrudRepository, repository} from '@loopback/repository';
import {PostgresqlDataSource} from '../datasources';
import {Bookmark, BookmarkRelations, Posts, Users} from '../models';
import {PostsRepository} from './posts.repository';
import {UsersRepository} from './users.repository';
import moment from 'moment';

export class BookmarkRepository extends DefaultCrudRepository<
  Bookmark,
  typeof Bookmark.prototype.id,
  BookmarkRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Bookmark.prototype.id>;

  public readonly post: BelongsToAccessor<Posts, typeof Bookmark.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
  ) {
    super(Bookmark, dataSource);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Bookmark> | {[P in keyof Bookmark]?: DeepPartial<Bookmark[P]>} | Bookmark,
    options?: AnyObject,
  ): Promise<Bookmark> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
