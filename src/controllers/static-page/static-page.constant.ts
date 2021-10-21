import {RequestBodyObject} from '@loopback/rest';

export interface IStaticPageBodyPost {
  alias: string;
  content: string;
}

export interface IStaticPageBodyPut {
  lias?: string;
  content?: string;
}

export const STATIC_PAGE_BODY_POST: RequestBodyObject = {
  content: {
    'application/json': {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          alias: {
            type: 'string',
          },
          content: {
            type: 'string',
          },
        },
        required: ['alias', 'content'],
      },
    },
  },
};
