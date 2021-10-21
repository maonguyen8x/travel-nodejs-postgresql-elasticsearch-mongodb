import {Where} from '@loopback/repository';
import {param, get, getModelSchemaRef, del, post, requestBody} from '@loopback/rest';
import {BookmarkLocation, LocationRequests, Locations, MediaContents, Rankings} from '../../models';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {BookmarkLocationHandler} from './bookmark-location.handler';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {BookmarkLocationWithLocationHadAttachmentInterface} from './bookmark-location.constant';

export class BookmarkLocationController {
  constructor(
    @inject(HandlerBindingKeys.BOOKMARK_LOCATION_HANDLER)
    public bookmarkLocationHandler: BookmarkLocationHandler,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/bookmark-locations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Add location to bookmark',
        content: {
          'application/json': {
            schema: getModelSchemaRef(BookmarkLocation),
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BookmarkLocation, {
            title: 'NewBookmarkLocation',
            exclude: ['id', 'createdAt', 'updatedAt', 'deletedAt', 'userId', 'status'],
          }),
        },
      },
    })
    bookmarkLocation: Omit<BookmarkLocation, 'id'>,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<BookmarkLocation> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkLocationHandler.create({
      userId,
      locationId: bookmarkLocation.locationId,
    });
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/bookmark-locations', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of BookmarkLocation model instances',
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
                  items: bookmarkLocationInfoSchema(),
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
    @param({
      name: 'filterBookmarkLocation',
      in: 'query',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              coordinates: {
                type: 'string',
              },
              offset: {
                type: 'number',
              },
              distance: {
                type: 'number',
              },
              limit: {
                type: 'number',
              },
              skip: {
                type: 'number',
              },
              order: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              where: {
                title: 'BookmarkLocation.WhereFilter',
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    })
    filter: {
      q: string;
      coordinates: string;
      offset: number;
      limit: number;
      distance: number;
      skip: number;
      where: object;
      order: string[];
    },
    @param.where(Locations, 'bookmarklocationFilterWhere')
    whereLocation?: Where<Locations>,
  ): Promise<{
    count: number;
    data: BookmarkLocationWithLocationHadAttachmentInterface[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkLocationHandler.find({userId, filter, whereLocation});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/bookmark-locations/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'BookmarkLocation DELETE success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async deleteById(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{success: boolean}> {
    const userId = parseInt(userProfile[securityId]);
    return this.bookmarkLocationHandler.deleteById(id, userId);
  }
}

export function bookmarkLocationInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(BookmarkLocation).definitions.BookmarkLocation.properties,
      distance: {
        type: 'number',
      },
      ranking: getModelSchemaRef(Rankings),
      location: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          totalPosts: {
            type: 'number',
          },
          type: {
            type: 'string',
          },
          locationRequest: getModelSchemaRef(LocationRequests),
          pageId: {
            type: 'number',
          },
          serviceId: {
            type: 'number',
          },
          attachments: {
            type: 'object',
            properties: {
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
            },
          },
        },
      },
    },
  };
}
