import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, Filter, repository} from '@loopback/repository';
import {compact} from 'lodash';
import {PostgresqlDataSource} from '../datasources';
import {MediaContents, MediaContentsRelations, Posts, Users} from '../models';
import {PostsRepository} from './posts.repository';
import {UsersRepository} from './users.repository';

export class MediaContentsRepository extends DefaultCrudRepository<
  MediaContents,
  typeof MediaContents.prototype.id,
  MediaContentsRelations
> {
  public readonly post: BelongsToAccessor<Posts, typeof MediaContents.prototype.id>;

  public readonly user: BelongsToAccessor<Users, typeof MediaContents.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(MediaContents, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
  }

  async validMediaContentIds(ids: number[]): Promise<number[]> {
    if (!ids.length) return ids;

    const filter: Filter<MediaContents> = {
      where: {
        id: {
          inq: ids,
        },
      },
    };
    return compact(await super.find(filter)).map((item) => item.id || 0);
  }
}
