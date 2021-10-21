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
  HasManyRepositoryFactory,
  OrClause,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {ChildComment, Comments, CommentsRelations, Likes, Posts, Users} from '../models';
import {ChildCommentRepository} from './child-comment.repository';
import {LikesRepository} from './likes.repository';
import {PostsRepository} from './posts.repository';
import {UsersRepository} from './users.repository';

export class CommentsRepository extends DefaultCrudRepository<
  Comments,
  typeof Comments.prototype.id,
  CommentsRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Comments.prototype.id>;

  public readonly post: BelongsToAccessor<Posts, typeof Comments.prototype.id>;

  public readonly likes: HasManyRepositoryFactory<Likes, typeof Comments.prototype.id>;

  public readonly childComments: HasManyRepositoryFactory<ChildComment, typeof Comments.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('LikesRepository')
    protected likesRepositoryGetter: Getter<LikesRepository>,
    @repository.getter('ChildCommentRepository')
    protected childCommentRepositoryGetter: Getter<ChildCommentRepository>,
  ) {
    super(Comments, dataSource);
    this.childComments = this.createHasManyRepositoryFactoryFor('childComments', childCommentRepositoryGetter);
    this.registerInclusionResolver('childComments', this.childComments.inclusionResolver);
    this.likes = this.createHasManyRepositoryFactoryFor('likes', likesRepositoryGetter);
    this.registerInclusionResolver('likes', this.likes.inclusionResolver);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Comments> | {[P in keyof Comments]?: DeepPartial<Comments[P]>} | Comments,
    options?: AnyObject,
  ): Promise<Comments> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  createAll(entities: DataObject<Comments>[], options?: AnyObject): Promise<Comments[]> {
    const newData = Array.from(entities, (item) => {
      return {
        ...item,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      };
    });
    return super.createAll(newData, options);
  }

  update(entity: Comments, options?: AnyObject): Promise<void> {
    const newData = new Comments({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(newData, options);
  }

  updateAll(
    data: Partial<Comments> | {[P in keyof Comments]?: DeepPartial<Comments[P]>} | Comments,
    where?: Condition<Comments> | AndClause<Comments> | OrClause<Comments>,
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
    id: typeof Comments.prototype.id,
    data: Partial<Comments> | {[P in keyof Comments]?: DeepPartial<Comments[P]>} | Comments,
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

  async deleteById(id: typeof Comments.prototype.id, options?: AnyObject): Promise<void> {
    await this.likes(id).delete();
    return super.deleteById(id, options);
  }
}
