import {AnyObject, Count, Filter, repository, Where} from '@loopback/repository';
import {BookmarkRepository, UsersRepository} from '../../repositories';
import {Bookmark, BookmarkWithRelations} from '../../models';
import {HttpErrors} from '@loopback/rest/dist';
import {handleError} from '../../utils/handleError';
import {inject} from '@loopback/context';
import {asyncLimiter} from '../../utils/Async-limiter';
import {PostLogicController} from '..';

export class BookmarkHandler {
  constructor(
    @repository(BookmarkRepository)
    public bookmarkRepository: BookmarkRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @inject('controllers.PostLogicController')
    public postLogicController: PostLogicController,
  ) {}

  async create(userId: number, id: number): Promise<Bookmark> {
    try {
      const target = await this.bookmarkRepository.count({
        userId,
        postId: id,
      });
      if (target.count) {
        throw new HttpErrors.BadRequest();
      }

      return await this.bookmarkRepository.create({
        postId: id,
        userId,
      });
    } catch (e) {
      return handleError(e);
    }
  }

  async count(userId: number, where?: Where<Bookmark>): Promise<Count> {
    try {
      return await this.bookmarkRepository.count({
        ...where,
        userId,
      });
    } catch (e) {
      return handleError(e);
    }
  }

  async find(userId: number, filter?: Filter<Bookmark>): Promise<{count: number; data: AnyObject[]}> {
    const ctlFilter = {
      order: ['createdAt DESC'],
      ...filter,
      where: {
        ...filter?.where,
        userId: userId,
      },
    };
    const result = await this.bookmarkRepository.find(ctlFilter);
    const data = await asyncLimiter(result.map((bookmark) => this.renderPost(bookmark, userId)));
    const count = await this.bookmarkRepository.count(ctlFilter.where);
    return {
      count: count.count,
      data,
    };
  }

  async renderPost(bookmark: BookmarkWithRelations, userId: number): Promise<Bookmark> {
    try {
      const post = await this.postLogicController.getDetailPostById(bookmark.postId, userId);
      return {
        ...bookmark,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        isAvailable: !!post,
        post: {
          ...post,
          mediaContents: post?.medias ? JSON.parse(post?.medias) : [],
          creator: this.usersRepository.convertDataUser(post?.creator),
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById(id: number, userId: number): Promise<Count> {
    return this.usersRepository.bookmarks(userId).delete({id: id});
  }
}
