import {Inclusion} from '@loopback/repository';
import {getModelSchemaRef, ReferenceObject, SchemaObject} from '@loopback/rest';
import {Avatars, MediaContents, PageReview, Posts, Profiles, Users} from '../../models';

export const filterIncludePageReview = (): Inclusion[] => [
  {
    relation: 'createdBy',
    scope: {
      include: [
        {
          relation: 'profiles',
          scope: {
            include: [
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
            ],
          },
        },
      ],
    },
  },
  {
    relation: 'post',
    scope: {
      include: [
        {
          relation: 'mediaContents',
        },
      ],
    },
  },
];

export const pageReviewSchema = (): ReferenceObject | SchemaObject => {
  return {
    title: 'PageReviewDetail',
    type: 'object',
    properties: {
      ...getModelSchemaRef(PageReview, {title: 'PageReviewDetail'}).definitions['PageReviewDetail'].properties,
      createdBy: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Users).definitions['Users'].properties,
          profiles: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Profiles).definitions['Profiles'].properties,
              avatars: {
                type: 'object',
                properties: {
                  ...getModelSchemaRef(Avatars).definitions['Avatars'].properties,
                  mediaContent: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(MediaContents).definitions['MediaContents'].properties,
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Posts).definitions['Posts'].properties,
          mediaContents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(MediaContents).definitions['MediaContents'].properties,
              },
            },
          },
          liked: {
            type: 'boolean',
          },
        },
      },
    },
  };
};
