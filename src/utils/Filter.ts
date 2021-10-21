import {AnyObject, Filter} from '@loopback/repository';

const MAX_LIMIT_FILTER = 100;
const DEFAULT_LIMIT_FILTER = 10;

export const filters = (filter?: Filter<AnyObject>): Filter<AnyObject> => {
  const limit = filter?.limit || DEFAULT_LIMIT_FILTER;

  return {
    ...filter,
    limit: limit > MAX_LIMIT_FILTER ? MAX_LIMIT_FILTER : limit,
  };
};
