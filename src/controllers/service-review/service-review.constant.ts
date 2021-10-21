import {Inclusion} from '@loopback/repository';

export const filterInclude = (): Inclusion[] => [
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
