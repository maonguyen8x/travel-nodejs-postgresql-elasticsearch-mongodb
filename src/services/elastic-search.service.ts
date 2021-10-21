import {AnyObject} from '@loopback/repository';
import logger from '../utils/logger';
import {handleError} from '../utils/handleError';
import {FROM_DEFAULT_ELASTICSEARCH, MAX_SIZE_DEFAULT_ELASTICSEARCH} from '../constants/variable.constant';
import {get} from 'lodash';
import axios from 'axios';

const ELASTICSEARCH_URI = process.env.ELASTICSEARCH_URI ?? 'http://localhost:5000';
// const ELASTICSEARCH_URI = 'http://125.212.238.251:5000';
export class ElasticSearchService {
  protected index: string;

  constructor() {}

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  async create(data: AnyObject): Promise<AnyObject> {
    // eslint-disable-next-line no-useless-catch
    try {
      return (await axios.post(encodeURI(`${ELASTICSEARCH_URI}/api/${this.index}`), data)).data;
    } catch (e) {
      handleError(e);
    }
  }

  async updateById(data: AnyObject, id?: number): Promise<AnyObject> {
    // eslint-disable-next-line no-useless-catch
    try {
      return (await axios.put(encodeURI(`${ELASTICSEARCH_URI}/api/${this.index}/${id}`), data)).data;
    } catch (e) {
      throw e;
    }
  }

  async get(filter: AnyObject): Promise<AnyObject> {
    // eslint-disable-next-line no-useless-catch
    try {
      // set default size and from
      filter.size = filter?.size || MAX_SIZE_DEFAULT_ELASTICSEARCH;
      filter.from = filter?.from || FROM_DEFAULT_ELASTICSEARCH;
      if (get(filter, 'query.bool.must_not')) {
        filter.query.bool['must_not'].push(
          {
            exists: {
              field: 'deletedAt',
            },
          },
          {
            exists: {
              field: 'blockedAt',
            },
          },
        );
      } else {
        if (get(filter, 'query.bool')) {
          filter.query.bool['must_not'] = [
            {
              exists: {
                field: 'deletedAt',
              },
            },
            {
              exists: {
                field: 'blockedAt',
              },
            },
          ];
        }
      }
      return (await axios.get(encodeURI(`${ELASTICSEARCH_URI}/api/${this.index}?filter=${JSON.stringify(filter)}`)))
        .data;
    } catch (e) {
      logger.error(e);
      return {};
    }
  }

  async deleteById(id?: number): Promise<AnyObject> {
    // eslint-disable-next-line no-useless-catch
    try {
      return (await axios.delete(encodeURI(`${ELASTICSEARCH_URI}/api/${this.index}/${id}`))).data;
    } catch (e) {
      throw e;
    }
  }

  setIndex(index: string): void {
    this.index = index;
  }
}
