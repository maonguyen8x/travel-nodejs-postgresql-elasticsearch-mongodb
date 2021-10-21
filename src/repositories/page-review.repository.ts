import {
  DefaultCrudRepository,
  BelongsToAccessor,
  repository,
  DeepPartial,
  AnyObject,
  Where,
  Count,
  Filter,
} from '@loopback/repository';
import {PageReview, PageReviewRelations, Users, Page, Posts, PageReviewWithRelations} from '../models';
import {PostgresqlDataSource} from '../datasources';

import {inject, Getter} from '@loopback/core';
import {PageRepository} from './page.repository';
import {UsersRepository} from './users.repository';
import {PostsRepository} from './posts.repository';
import dayjs from 'dayjs';

export class PageReviewRepository extends DefaultCrudRepository<
  PageReview,
  typeof PageReview.prototype.id,
  PageReviewRelations
> {
  public readonly createdBy: BelongsToAccessor<Users, typeof PageReview.prototype.id>;
  public readonly page: BelongsToAccessor<Page, typeof PageReview.prototype.id>;
  public readonly post: BelongsToAccessor<Posts, typeof PageReview.prototype.id>;

  constructor(
    @inject('datasources.postgresql') dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
  ) {
    super(PageReview, dataSource);

    // include user
    this.createdBy = this.createBelongsToAccessorFor('createdBy', usersRepositoryGetter);
    this.registerInclusionResolver('createdBy', this.createdBy.inclusionResolver);

    // include page
    this.page = this.createBelongsToAccessorFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);

    // include post
    this.post = this.createBelongsToAccessorFor('post', postsRepositoryGetter);
    this.registerInclusionResolver('post', this.post.inclusionResolver);
  }

  async create(
    data: Partial<PageReview> | {[P in keyof PageReview]?: DeepPartial<PageReview[P]>} | PageReview,
    options?: AnyObject,
  ): Promise<PageReview> {
    const record = await super.create(
      {
        ...data,
      },
      options,
    );

    return record;
  }

  async updateById(
    id: typeof PageReview.prototype.id,
    data: Partial<PageReview> | {[P in keyof PageReview]?: DeepPartial<PageReview[P]>} | PageReview,
    options?: AnyObject,
  ): Promise<void> {
    super.updateById(
      id,
      {
        ...data,
      },
      options,
    );
  }

  find(filter?: Filter<PageReview>, options?: AnyObject): Promise<(PageReview & PageReviewRelations)[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
        },
      },
      options,
    );
  }

  count(where?: Where<PageReview>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
    });
  }

  async deleteById(id: typeof PageReview.prototype.id, options?: AnyObject): Promise<void> {
    await this.updateById(
      id,
      {
        deletedAt: dayjs().toISOString(),
      },
      options,
    );
  }

  findOne(filter?: Filter<PageReview>, options?: AnyObject): Promise<(PageReview & PageReviewWithRelations) | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
        },
      },
      options,
    );
  }
}
