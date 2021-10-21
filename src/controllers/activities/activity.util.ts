import {ActivityParticipantResponseInterface, CreateActivityRequestInterface} from './activity.constant';
import * as Joi from 'joi';
import {HttpErrors} from '@loopback/rest/dist';
import {userInfoQuery} from '../specs/user-controller.specs';
import {ActivityParticipantWithRelations, UsersWithRelations} from '../../models';
import {UserWithRelatedPageId} from '../user/user-interface';
import { convertDataUser } from '../user/user.util';
import { get } from 'lodash';

export const validateActivity = (activity: CreateActivityRequestInterface): boolean => {
  const schema = Joi.object({
    name: Joi.string().max(150).required(),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate().allow('').optional(),
    price: Joi.number().min(0).max(999999999).required(),
    introduction: Joi.string(),
    location: Joi.object({
      name: Joi.string(),
      coordinates: Joi.string(),
      formatedAddress: Joi.string(),
      address: Joi.string(),
      country: Joi.string(),
      areaLevel1: Joi.string(),
      areaLevel2: Joi.string(),
      areaLevel3: Joi.string(),
      areaLevel4: Joi.string().allow('').optional(),
      areaLevel5: Joi.string().allow('').optional(),
      latitude: Joi.number(),
      longitude: Joi.number(),
    }),
    mediaContents: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().required(),
          url: Joi.string(),
          urlBlur: Joi.string(),
          urlTiny: Joi.string(),
          urlOptimize: Joi.string(),
          urlBackground: Joi.string(),
          metadata: Joi.string(),
          publicId: Joi.string(),
          format: Joi.string(),
          mediaType: Joi.string(),
          resourceType: Joi.string(),
          fileName: Joi.string(),
          path: Joi.string(),
          createdAt: Joi.string().isoDate(),
          updatedAt: Joi.string().isoDate(),
          userId: Joi.number().required(),
        }),
      )
      .required(),
    showOnProfile: Joi.bool(),
    currencyId: Joi.number(),
    locationId: Joi.number(),
    postId: Joi.number(),
  });
  const {error} = schema.validate(activity);
  if (error) {
    throw new HttpErrors.BadRequest(error.message);
  } else {
    return true;
  }
};

export const validateUpdateActivity = (activity: CreateActivityRequestInterface): boolean => {
  const schema = Joi.object({
    name: Joi.string().max(150),
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate().allow('').optional(),
    price: Joi.number().min(0).max(999999999).required(),
    introduction: Joi.string(),
    location: Joi.object({
      name: Joi.string(),
      coordinates: Joi.string(),
      formatedAddress: Joi.string(),
      address: Joi.string(),
      country: Joi.string(),
      areaLevel1: Joi.string(),
      areaLevel2: Joi.string(),
      areaLevel3: Joi.string(),
      areaLevel4: Joi.string().allow('').optional(),
      areaLevel5: Joi.string().allow('').optional(),
      latitude: Joi.number(),
      longitude: Joi.number(),
    }),
    mediaContents: Joi.array().items(
      Joi.object({
        id: Joi.number().required(),
        url: Joi.string(),
        urlBlur: Joi.string(),
        urlTiny: Joi.string(),
        urlOptimize: Joi.string(),
        urlBackground: Joi.string(),
        metadata: Joi.string(),
        publicId: Joi.string(),
        format: Joi.string(),
        mediaType: Joi.string(),
        resourceType: Joi.string(),
        fileName: Joi.string(),
        path: Joi.string(),
        createdAt: Joi.string().isoDate(),
        updatedAt: Joi.string().isoDate(),
        userId: Joi.number().required(),
      }),
    ),
    currencyId: Joi.number(),
    locationId: Joi.number(),
    postId: Joi.number(),
  });
  const {error} = schema.validate(activity);
  if (error) {
    throw new HttpErrors.BadRequest(error.message);
  } else {
    return true;
  }
};

export const formatActivityParticipant = (participant: ActivityParticipantWithRelations): ActivityParticipantResponseInterface => {
  return {
    ...participant,
    user: {
      ...participant.user,
      ...convertDataUser(participant.user),
      followStatus: participant.user.following
        ? get(participant.user.following[0] || {}, 'followStatus', undefined)
        : undefined,
      followed: participant.user.following ? Boolean(participant.user.following[0] || null) : undefined,
    },
  };
}
export function activityParticipantQuery(userId: number) {
  return {
    include: [
      {
        relation: 'user',
        scope: {
          include: [
            ...userInfoQuery(true, userId).include,
            {
              relation: 'following',
              scope: {
                where: {
                  userId,
                },
              },
            },
          ],
        },
      },
    ],
  };
}
