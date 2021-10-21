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
import {ChildComment, Comments, Likes, LikesRelations, Posts, Rankings, ReplyRanking, Users} from '../models';
import {ChildCommentRepository} from './child-comment.repository';
import {CommentsRepository} from './comments.repository';
import {PostsRepository} from './posts.repository';
import {RankingsRepository} from './rankings.repository';
import {ReplyRankingRepository} from './reply-ranking.repository';
import {UsersRepository} from './users.repository';

export class LikesRepository extends DefaultCrudRepository<Likes, typeof Likes.prototype.id, LikesRelations> {
  public readonly user: BelongsToAccessor<Users, typeof Likes.prototype.id>;

  public readonly post: BelongsToAccessor<Posts, typeof Likes.prototype.id>;

  public readonly comment: BelongsToAccessor<Comments, typeof Likes.prototype.id>;

  public readonly childComment: BelongsToAccessor<ChildComment, typeof Likes.prototype.id>;

  public readonly ranking: BelongsToAccessor<Rankings, typeof Likes.prototype.id>;

  public readonly replyRanking: BelongsToAccessor<ReplyRanking, typeof Likes.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('CommentsRepository')
    protected commentsRepositoryGetter: Getter<CommentsRepository>,
    @repository.getter('ChildCommentRepository')
    protected childCommentRepositoryGetter: Getter<ChildCommentRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @repository.getter('ReplyRankingRepository')
    protected replyRankingRepositoryGetter: Getter<ReplyRankingRepository>,
  ) {
    super(Likes, dataSource);
    this.replyRanking = this.createBelongsToAccessorFor('replyRanking', replyRankingRepositoryGetter);
    this.registerInclusionResolver('replyRanking', this.replyRanking.inclusionResolver);
    this.ranking = this.createBelongsToAccessorFor('ranking', rankingsRepositoryGetter);
    this.registerInclusionResolver('ranking', this.ranking.inclusionResolver);
    this.childComment = this.createBelongsToAccessorFor('childComment', childCommentRepositoryGetter);
    this.registerInclusionResolver('childComment', this.childComment.inclusionResolver);
    this.comment = this.createBelongsToAccessorFor('comment', commentsRepositoryGetter);
    this.registerInclusionResolver('comment', this.comment.inclusionResolver);
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  create(
    entity: Partial<Likes> | {[P in keyof Likes]?: DeepPartial<Likes[P]>} | Likes,
    options?: AnyObject,
  ): Promise<Likes> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  createAll(entities: DataObject<Likes>[], options?: AnyObject): Promise<Likes[]> {
    const newData = Array.from(entities, (item) => {
      return {
        ...item,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      };
    });
    return super.createAll(newData, options);
  }

  update(entity: Likes, options?: AnyObject): Promise<void> {
    const newData = new Likes({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(newData, options);
  }

  updateAll(
    data: Partial<Likes> | {[P in keyof Likes]?: DeepPartial<Likes[P]>} | Likes,
    where?: Condition<Likes> | AndClause<Likes> | OrClause<Likes>,
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
    id: typeof Likes.prototype.id,
    data: Partial<Likes> | {[P in keyof Likes]?: DeepPartial<Likes[P]>} | Likes,
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

  async liked(postId: number, userId: number): Promise<boolean> {
    return !!(await this.findOne({where: {postId, userId}}));
  }
}
