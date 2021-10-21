import _, {has, get} from 'lodash';
import {AnyObject} from '@loopback/repository';

export const POSTGRE_DUPLICATE_ERROR_CODE = '23505';
export const MEIDA_STORE_PATH = process.env.MEIDA_STORE_PATH || 'https://5002302-s3user.cdn.storebox.vn/jgooooo-dev';
export const IMAGE_FOLDER_PATH = '/dist/images';
export const IMAGE_BACKGROUND_POST_FOLDER_PATH = '/background-post';

export const MEDIA_SERVER_INFO = {
  media_uri: process.env.MEDIA_URI || 'http://localhost:9999/v1/medias',
  prefix_delete: '/public',
  LIMIT_FILE_SIZE: Number(process.env.LIMIT_FILE_SIZE || 25) * 1024 * 1000,
};

export const LANGUAGES = {
  EN: 'en',
  VI: 'vi',
};
export interface ElasticSearchResultHitInterface {
  _source?: {
    id?: number;
  };
}

export interface ElasticSearchResultInterface {
  body?: {
    hits?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hits?: any[];
    };
  };
}

export const getHit = (result: ElasticSearchResultInterface) => get(result, 'body.hits.hits', []);

export enum reportStatus {
  WAITING_FOR_PROCESSING = 'WAITING_FOR_PROCESSING',
  PROCESSING = 'PROCESSING',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export enum reportTypes {
  REPORT_RANKING = 'REPORT_RANKING',
  REPORT_POST = 'REPORT_POST',
  REPORT_LOCATION = 'REPORT_LOCATION',
  REPORT_USER = 'REPORT_USER',
  REPORT_PAGE = 'REPORT_PAGE',
  REPORT_REVIEW_PAGE = 'REPORT_REVIEW_PAGE',
  REPORT_ACTIVITY = 'REPORT_ACTIVITY',
}

export const ELASTICwhereToMatchs = (where: AnyObject) => {
  const result: AnyObject[] = [];
  _.map(Object.keys(where), (item) => {
    const object = where[String(item)];
    if (item === 'and') {
      const mustAnd: AnyObject = [];
      _.map(object, (subItemAnd: AnyObject) => _.map(ELASTICwhereToMatchs(subItemAnd), (i) => mustAnd.push(i)));
      result.push({
        bool: {
          must: mustAnd,
        },
      });
      return;
    }
    if (has(object, 'inq')) {
      result.push({
        bool: {
          should: _.map(object['inq'], (value: string | number) => {
            return {
              match: {
                [item]: value,
              },
            };
          }),
        },
      });
      return;
    }
    if (has(object, 'lt') || has(object, 'lte') || has(object, 'gt') || has(object, 'gte')) {
      result.push({
        range: {
          [item]: {
            ...object,
          },
        },
      });
      return;
    }
    result.push({
      match: {
        [item]: where[String(item)],
      },
    });
    return;
  });
  return result;
};

export const ELASTICwhereToNotMatchs = (where: AnyObject) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: AnyObject[] = [];
  Object.keys(where).map((item) => {
    const object = where[String(item)];
    if (has(object, 'nin')) {
      result.push({
        bool: {
          should: object['nin'].map((value: string | number) => {
            return {
              match: {
                [item]: value,
              },
            };
          }),
        },
      });
    }
  });
  return result;
};
