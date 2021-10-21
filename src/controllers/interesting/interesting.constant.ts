import {Interesting, Locations, MediaContents, Rankings} from '../../models';
import {getModelSchemaRef, SchemaObject} from '@loopback/rest';
import {Where} from '@loopback/repository';

export interface InterestingWithLocationAttachmentInterface extends Interesting {
  data?: DataInterestingWithLocationAttachmentInterface;
}

export interface DataInterestingWithLocationAttachmentInterface extends Locations {
  type: string;
  attachments?: MediaContents[];
  key?: number;
  distance?: number;
  pageId: number;
  ranking: Rankings;
}

export interface FilterSearchInterestingInterface {
  q?: string;
  offset?: number;
  limit?: number;
  skip?: number;
  type?: string;
  where?: Where<Locations>;
  order?: string[];
}

export function interestingSchema(): SchemaObject {
  return {
    type: 'object',
    properties: {
      ...getModelSchemaRef(Interesting).definitions.Interesting.properties,
      // location: getModelSchemaRef(Locations),
      // service: getModelSchemaRef(Services),
      data: {
        type: 'object',
        title: 'interestingSchemaData',
        properties: {
          ...getModelSchemaRef(Locations).definitions.Locations.properties,
          type: {
            type: 'string',
          },
          pageId: {
            type: 'number',
          },
          serviceId: {
            type: 'number',
          },
          ranking: getModelSchemaRef(Rankings),
          attachments: {
            type: 'array',
            title: 'interestingAttachment',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
    },
  };
}

export function interestingQuery(userId: number) {
  return {
    include: [
      {
        relation: 'location',
      },
    ],
    where: {
      userId: userId,
    },
  };
}
