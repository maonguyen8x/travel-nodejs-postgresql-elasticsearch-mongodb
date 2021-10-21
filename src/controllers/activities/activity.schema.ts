import {getModelSchemaRef} from '@loopback/openapi-v3';
import {Locations, MediaContents, Posts} from '../../models';
import {userInfoSchema} from '../specs/user-controller.specs';

export const getActivityPostSchema = () => ({
  type: 'object',
  properties: {
    ...getModelSchemaRef(Posts, {
      exclude: ['listUsersReceiveNotifications'],
      title: 'contentPost',
    }).definitions.contentPost.properties,
    location: getModelSchemaRef(Locations),
    metadata: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
        },
      },
    },
    mediaContents: {
      type: 'array',
      items: getModelSchemaRef(MediaContents),
    },
    creator: userInfoSchema(),
    liked: {
      type: 'boolean',
    },
    marked: {
      type: 'boolean',
    },
    rated: {
      type: 'boolean',
    },
    isSavedLocation: {
      type: 'boolean',
    },
  },
});
