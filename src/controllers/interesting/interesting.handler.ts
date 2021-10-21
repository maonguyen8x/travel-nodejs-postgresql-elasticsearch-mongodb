import {repository, Filter, AnyObject} from '@loopback/repository';
import {InterestingRepository, LocationsRepository, UsersRepository} from '../../repositories';
import {inject} from '@loopback/context';
import {LocationsLogicController} from '..';
import {Interesting, InterestingRelations} from '../../models';
import {handleError} from '../../utils/handleError';
import {
  InterestingWithLocationAttachmentInterface,
  interestingQuery,
  FilterSearchInterestingInterface,
} from './interesting.constant';
import {HandleSearchResultInterface} from '../locations/location-interface';
import {changeAlias, parseOrderToElasticSort} from '../../utils/handleString';
import {isEmpty} from 'lodash';
import _ from 'lodash';
import {ElasticSearchResultHitInterface, ELASTICwhereToMatchs, getHit} from '../../configs/utils-constant';
import {LocationActivityInterface} from '../util/util-interface';

export class InterestingHandler {
  constructor(
    @repository(InterestingRepository)
    public interestingRepository: InterestingRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @inject('controllers.LocationsLogicController')
    public locationsLogicController: LocationsLogicController,
  ) {}

  async create(interesting: Omit<Interesting, 'id'>, userId: number): Promise<Interesting> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      delete interesting.userId;
      const isExist = await this.interestingRepository.findOne({
        where: {
          locationId: interesting.locationId,
          userId,
        },
      });
      if (isExist) {
        return isExist;
        // throw new HttpErrors.Conflict('You have already added this item before');
      }
      return await this.interestingRepository.create({
        ...interesting,
        userId,
      });
    } catch (e) {
      return handleError(e);
    }
  }

  async find({
    userId,
    filter,
  }: {
    userId: number;
    filter?: Filter<Interesting>;
  }): Promise<{
    data: AnyObject[];
    count: number;
  }> {
    try {
      const filterInteresting: Filter<Interesting> = {
        ...filter,
        ...interestingQuery(userId),
        where: {
          ...filter?.where,
          ...interestingQuery(userId).where,
          userId,
        },
      };
      const data = await this.interestingRepository.find(filterInteresting);
      const count = await this.interestingRepository.count(filterInteresting.where);
      const result = await Promise.all(data.map((item) => this.getInterestingWithLocationHadAttachment(item, userId)));
      return {
        count: count.count,
        data: result,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById(
    userId: number,
    interestingId: number,
  ): Promise<{
    message: string;
  }> {
    try {
      await this.interestingRepository.deleteAll({
        id: interestingId,
        userId,
      });
      return {
        message: 'remove successful',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async searchInterests(
    userId: number,
    filter: FilterSearchInterestingInterface,
  ): Promise<{
    data: (HandleSearchResultInterface | LocationActivityInterface | null)[];
    count: number;
  }> {
    try {
      const interestingId = (
        await this.interestingRepository.find({
          where: {
            userId,
          },
        })
      )
        .map((item) => {
          return item.locationId;
        })
        .filter((item) => item);
      const result = await this.handleElasticSearch(filter?.type || '', filter, interestingId, filter?.q);
      const data = await this.locationsLogicController.getListLocationWithMediaContent(result.ids, userId);
      return {
        count: result.count,
        data,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async handleElasticSearch(
    type: string,
    filter?: AnyObject,
    itemIds?: number[],
    q?: string,
  ): Promise<{
    ids: number[];
    count: number;
  }> {
    const result: {
      ids: number[];
      count: number;
    } = {
      ids: [],
      count: 0,
    };
    const where = filter?.where || {};
    const matchs = ELASTICwhereToMatchs(where);
    const must: AnyObject[] = [...matchs];
    if (q?.length) {
      must.push({
        multi_match: {
          query: changeAlias(q).trim(),
          operator: 'and',
          fields: ['name', 'formatedAddress'],
        },
      });
    }
    must.push({
      terms: {
        id: itemIds,
      },
    });
    const body: AnyObject = {
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      sort: [
        ...(q?.length
          ? [
              {
                _score: {
                  order: 'desc',
                },
              },
            ]
          : []),
        ...parseOrderToElasticSort(filter?.order || ['']),
      ],
      query: {
        bool: {
          must: must,
        },
      },
    };
    let searchResult: AnyObject;
    // eslint-disable-next-line prefer-const
    searchResult = await this.locationsRepository.elasticService.get(body);
    if (!isEmpty(searchResult)) {
      result.count = _.get(searchResult, 'body.hits.total.value', 0);
      const hit = getHit(searchResult);
      const getIdsFromHit = (item: ElasticSearchResultHitInterface) => _.get(item, '_source.id', 0);
      result.ids = Array.from(hit, getIdsFromHit).filter((item) => item);
    }

    return result;
  }

  async getInterestingWithLocationHadAttachment(
    interesting: Interesting & InterestingRelations,
    userId?: number,
  ): Promise<InterestingWithLocationAttachmentInterface> {
    if (interesting?.location) {
      const locationWithAttachment = await this.locationsLogicController.handleSearchResult(
        interesting.location,
        userId,
      );
      return {
        ...interesting,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        data: {
          ...locationWithAttachment,
          type: interesting?.location?.locationType || '',
          attachments: locationWithAttachment?.attachments?.mediaContents,
        },
      };
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return {
      ...interesting,
    };
  }
}
