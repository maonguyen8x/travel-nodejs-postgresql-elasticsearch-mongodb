import {getModelSchemaRef} from '@loopback/openapi-v3';
import {
  Avatars,
  Backgrounds,
  MediaContents,
  Profiles,
  UserAddress,
  UserBirthday,
  UserEmail,
  UserGender,
  UserIntroduce,
  UserPhone,
  Users,
  UserWebsite,
  UserWork,
} from '../../models';

export const UserProfileSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {type: 'string'},
    email: {type: 'string'},
    name: {type: 'string'},
  },
};

export function userInfoSchema() {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Users, {
        title: 'UsersInfoSchema',
        exclude: ['isActive', 'createdAt', 'updatedAt', 'roles'],
      }).definitions.UsersInfoSchema.properties,
      email: getModelSchemaRef(UserEmail, {exclude: ['id', 'userId']}),
      relatedPageId: {
        type: 'number',
      },
      profiles: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Profiles, {
            title: 'profile',
            exclude: ['id', 'userId'],
          }).definitions['profile'].properties,
          avatars: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Avatars, {
                title: 'avatars',
                exclude: ['id', 'profileId'],
              }).definitions['avatars'].properties,
              mediaContent: getModelSchemaRef(MediaContents),
            },
          },
          backgrounds: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Backgrounds, {
                title: 'backgrounds',
                exclude: ['id', 'profileId'],
              }).definitions['backgrounds'].properties,
              mediaContent: getModelSchemaRef(MediaContents),
            },
          },
          address: getModelSchemaRef(UserAddress, {
            exclude: ['id', 'profileId'],
          }),
          introduce: getModelSchemaRef(UserIntroduce, {
            exclude: ['id', 'profileId'],
          }),
          work: getModelSchemaRef(UserWork, {exclude: ['id', 'profileId']}),
          website: getModelSchemaRef(UserWebsite, {
            exclude: ['id', 'profileId'],
          }),
          phone: getModelSchemaRef(UserPhone, {exclude: ['id', 'profileId']}),
          gender: getModelSchemaRef(UserGender, {exclude: ['id', 'profileId']}),
          birthday: getModelSchemaRef(UserBirthday, {
            exclude: ['id', 'profileId'],
          }),
        },
      },
    },
  };
}

export function userInfoQuery(permission: boolean, userId?: number) {
  if (!permission) {
    return {
      include: [
        {
          relation: 'page',
        },
        {
          relation: 'email',
        },
        {
          relation: 'profiles',
          scope: {
            include: [
              {
                relation: 'birthday',
              },
              {
                relation: 'gender',
              },
              {
                relation: 'address',
              },
              {
                relation: 'introduce',
              },
              {
                relation: 'work',
              },
              {
                relation: 'website',
              },
              {
                relation: 'phone',
              },
              {
                relation: 'avatars',
                scope: {
                  include: [
                    {
                      relation: 'mediaContent',
                    },
                  ],
                },
              },
              {
                relation: 'backgrounds',
                scope: {
                  include: [
                    {
                      relation: 'mediaContent',
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
  }
  return {
    include: [
      {
        relation: 'email',
        scope: {
          where: {
            isPublic: true,
          },
        },
      },
      {
        relation: 'page',
      },
      {
        relation: 'profiles',
        scope: {
          include: [
            {
              relation: 'birthday',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'gender',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'address',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'introduce',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'work',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'website',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'phone',
              scope: {
                where: {
                  isPublic: true,
                },
              },
            },
            {
              relation: 'avatars',
              scope: {
                include: [
                  {
                    relation: 'mediaContent',
                  },
                ],
              },
            },
            {
              relation: 'backgrounds',
              scope: {
                include: [
                  {
                    relation: 'mediaContent',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}

const CredentialsSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
    deviceToken: {
      type: 'string',
    },
    language: {
      type: 'string',
    },
    macAddress: {
      type: 'string',
    },
    ipAddress: {
      type: 'string',
    },
    brand: {
      type: 'string',
    },
    model: {
      type: 'string',
    },
    systemVersion: {
      type: 'string',
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};
