import {Getter, inject} from '@loopback/core';
import {
  AnyObject,
  BelongsToAccessor,
  DeepPartial,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {ChildComment, ChildCommentRelations, Comments, Likes, Users} from '../models';
import {CommentsRepository} from './comments.repository';
import {LikesRepository} from './likes.repository';
import {UsersRepository} from './users.repository';

export class ChildCommentRepository extends DefaultCrudRepository<
  ChildComment,
  typeof ChildComment.prototype.id,
  ChildCommentRelations
> {
  public readonly comment: BelongsToAccessor<Comments, typeof ChildComment.prototype.id>;

  public readonly user: BelongsToAccessor<Users, typeof ChildComment.prototype.id>;

  public readonly likes: HasManyRepositoryFactory<Likes, typeof ChildComment.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('CommentsRepository')
    protected commentsRepositoryGetter: Getter<CommentsRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('LikesRepository')
    protected likesRepositoryGetter: Getter<LikesRepository>,
  ) {
    super(ChildComment, dataSource);
    this.likes = this.createHasManyRepositoryFactoryFor('likes', likesRepositoryGetter);
    this.registerInclusionResolver('likes', this.likes.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.comment = this.createBelongsToAccessorFor('comment', commentsRepositoryGetter);
    this.registerInclusionResolver('comment', this.comment.inclusionResolver);
  }

  create(
    entity: Partial<ChildComment> | {[P in keyof ChildComment]?: DeepPartial<ChildComment[P]>} | ChildComment,
    options?: AnyObject,
  ): Promise<ChildComment> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
        totalLike: 0,
      },
      options,
    );
  }

  updateById(
    id: typeof ChildComment.prototype.id,
    data: Partial<ChildComment> | {[P in keyof ChildComment]?: DeepPartial<ChildComment[P]>} | ChildComment,
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
