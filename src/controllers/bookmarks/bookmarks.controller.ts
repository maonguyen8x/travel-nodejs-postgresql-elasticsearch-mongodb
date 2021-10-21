import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/context';
import {AnyObject, Count, CountSchema, Filter, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {Bookmark} from '../../models';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {postInfoQueryForBookmark, postInfoSchema} from '../posts/post.schema';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {BookmarkHandler} from './bookmark.handler';

export class BookmarksController {
  constructor(
    @inject(HandlerBindingKeys.BOOKMARK_HANDLER)
    public bookmarkHandler: BookmarkHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/posts/{id}/bookmarks', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Bookmark model instance',
        content: {'application/json': {schema: getModelSchemaRef(Bookmark)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<Bookmark> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkHandler.create(userId, id);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/bookmarks/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Bookmark model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.where(Bookmark) where?: Where<Bookmark>,
  ): Promise<Count> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkHandler.count(userId, where);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/bookmarks', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Bookmark model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: bookmarkInfoSchema(),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(Bookmark, {name: 'filterBookmark'}) filter?: Filter<Bookmark>,
  ): Promise<{count: number; data: AnyObject[]}> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkHandler.find(userId, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/bookmarks/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Bookmark DELETE success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: CountSchema,
              },
            },
          },
        },
      },
    },
  })
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Count> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkHandler.deleteById(id, userId);
  }
}

export function bookmarkInfoSchema() {
  return {
    type: 'object',
    title: 'BookmarkInfo',
    properties: {
      ...getModelSchemaRef(Bookmark, {title: 'bookmark'}).definitions.bookmark.properties,
      post: postInfoSchema(),
      isAvailable: {
        type: 'boolean',
      },
    },
  };
}

export function bookmarkInfoQuery(userId: number) {
  return {
    include: [
      {
        relation: 'post',
        scope: {
          ...postInfoQueryForBookmark(true, userId),
        },
      },
    ],
  };
}
