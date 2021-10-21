import {AnyObject, Filter, repository, Where} from '@loopback/repository';
import {
  BookmarkLocationRepository,
  LocationRequestsRepository,
  LocationsRepository,
  MyLocationsRepository,
  PostsRepository,
  RankingsRepository,
} from '../../repositories';
import {BookmarkLocation, BookmarkLocationWithRelations, Locations, MyLocations, Users} from '../../models';
import {handleError} from '../../utils/handleError';
import {
  BookmarkLocationStatusEnums,
  BookmarkLocationWithLocationHadAttachmentInterface,
} from './bookmark-location.constant';
import {sortByList} from '../../utils/Array';
import {ELASTICwhereToMatchs} from '../../configs/utils-constant';
import {changeAlias, parseOrderToElasticSort, parseStringToGeo} from '../../utils/handleString';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import get from 'lodash/get';
import {POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import {HandleSearchResultInterface} from '../locations/location-interface';
import {HttpErrors} from '@loopback/rest/dist';
import {ErrorCode} from '../../constants/error.constant';
import {LocationTypesEnum} from '../../configs/location-constant';
import {MYMAP_TYPE_HAD_CAME} from '../../configs/mymap-constants';
import {RANKING_ACCESS_TYPE_ACCEPTED, RANKING_TYPE_RANKING_LOCATION} from '../../configs/ranking-constant';
import {convertPointRankingToPointScore} from '../../utils/common';

export class BookmarkLocationHandler {
  constructor(
    @repository(BookmarkLocationRepository)
    public bookmarkLocationRepository: BookmarkLocationRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(MyLocationsRepository)
    public myLocationsRepository: MyLocationsRepository,
    @repository(LocationRequestsRepository)
    public locationRequestsRepository: LocationRequestsRepository,
  ) {}

  async create({locationId, userId}: {locationId: number; userId: number}): Promise<BookmarkLocation> {
    try {
      const current = await this.bookmarkLocationRepository.findOne({
        where: {
          locationId,
          userId,
        },
      });
      if (current) {
        return current;
      }
      const hadWrote = await this.postsRepository.isPublishedWithLocation(userId, locationId);
      return await this.bookmarkLocationRepository.create({
        locationId,
        userId,
        status: hadWrote ? BookmarkLocationStatusEnums.published : BookmarkLocationStatusEnums.unpublished,
      });
    } catch (e) {
      return handleError(e);
    }
  }

  async update({
    locationId,
    userId,
  }: {
    locationId: number;
    userId: number;
  }): Promise<{
    success: boolean;
  }> {
    try {
      const current = await this.bookmarkLocationRepository.findOne({
        where: {
          locationId,
          userId,
        },
      });
      const hadWrote = await this.postsRepository.isPublishedWithLocation(userId, locationId);
      if (current?.id) {
        await this.bookmarkLocationRepository.updateById(current.id, {
          status: hadWrote ? BookmarkLocationStatusEnums.published : BookmarkLocationStatusEnums.unpublished,
        });
      } else {
        await this.bookmarkLocationRepository.create({
          locationId,
          userId,
          status: hadWrote ? BookmarkLocationStatusEnums.published : BookmarkLocationStatusEnums.unpublished,
        });
      }
      return {
        success: true,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById(
    id: typeof BookmarkLocation.prototype.id,
    userId: typeof Users.prototype.id,
  ): Promise<{success: boolean}> {
    try {
      if (!userId) {
        throw new HttpErrors.NotFound(ErrorCode.USER_NOT_FOUND);
      }
      const exist = await this.bookmarkLocationRepository.findOne({
        where: {
          userId,
          id,
        },
      });
      if (!exist) {
        throw new HttpErrors.NotFound(ErrorCode.BOOKMARK_LOCATION_NOT_FOUND);
      }
      const current = await this.myLocationsRepository.findOne({
        where: {
          userId,
          locationId: exist.locationId,
        },
      });
      await this.myLocationsRepository.deleteAll({
        userId,
        id: current?.id,
      });
      if (current?.myMapType === MYMAP_TYPE_HAD_CAME) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleRemoveLocationIdFromPost(current.locationId, userId);
      }
      await this.deleteAcceptRanking(userId, exist.locationId);
      // TODO: Not yet update total review
      // await this.updateTotalReview(exist.locationId);
      await this.bookmarkLocationRepository.deleteById(id);
      await this.locationsRepository.deleteLocationWhereById(exist.locationId);
      return {
        success: true,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async handleRemoveLocationIdFromPost(locationId: number, userId: number): Promise<void> {
    const posts = await this.postsRepository.find({
      where: {
        creatorId: userId,
        locationId,
      },
    });
    for (const post of posts) {
      await this.postsRepository.replaceById(post.id, {
        ...omit(post, ['id', 'locationId']),
      });
    }
  }

  async updateTotalReview(locationId: number): Promise<void> {
    const postCount = await this.postsRepository.count({
      locationId: locationId,
      isPublicLocation: true,
      accessType: POST_ACCESS_TYPE_PUBLIC,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      deletedAt: null,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      blockedAt: null,
    });
    await this.locationsRepository.updateById(locationId, {
      totalReview: postCount.count,
    });
  }

  async deleteAcceptRanking(userId: number, locationId: number): Promise<void> {
    const target = await this.rankingsRepository.findOne({
      where: {
        userId: userId,
        locationId: locationId,
      },
    });
    if (target?.id) {
      await this.rankingsRepository.deleteById(target.id);
      await this.updateRankingPoint(locationId);
    }
  }

  async updateRankingPoint(locationId: number): Promise<void> {
    let _score = 0;
    let _averagePoint = 0;
    const listRanking = await this.rankingsRepository.find({
      where: {
        locationId: locationId,
        rankingType: RANKING_TYPE_RANKING_LOCATION,
        rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
      },
    });
    if (listRanking.length) {
      listRanking.map((item) => {
        _score += convertPointRankingToPointScore(item.point || 0);
        _averagePoint += item.point || 0;
      });
      _averagePoint = Math.round(_averagePoint / listRanking.length);
    }
    await this.locationsRepository.updateById(locationId, {
      score: _score,
      averagePoint: _averagePoint,
      totalReview: listRanking.length,
    });
  }

  async find({
    userId,
    filter,
    whereLocation,
  }: {
    userId: number;
    filter?: {
      q: string;
      coordinates: string;
      offset: number;
      limit: number;
      distance: number;
      skip: number;
      where: object;
      order: string[];
    };
    whereLocation?: Where<Locations>;
  }): Promise<{
    count: number;
    data: BookmarkLocationWithLocationHadAttachmentInterface[];
  }> {
    try {
      let data: BookmarkLocationWithRelations[];
      let count: number;
      const newFilter = {
        ...omit(filter, ['q', 'coordinates', 'distance']),
      };
      const listLocationSearch = await this.handleSearchingBookmarkLocation({
        filter: {
          ...newFilter,
        },
        userId,
        q: filter?.q,
        coordinates: filter?.coordinates,
        distance: filter?.distance,
        whereLocation: {
          ...whereLocation,
          locationType: {
            inq: [LocationTypesEnum.where, LocationTypesEnum.other],
          },
        },
      });
      const hit = listLocationSearch?.body?.hits?.hits || [];
      // eslint-disable-next-line prefer-const
      count = listLocationSearch?.body?.hits?.total?.value || 0;
      const getIdFromHit = (item: {
        _source: {
          id: number;
        };
      }) => {
        const result = item?._source?.id || 0;
        if (result) {
          return result;
        }
      };
      let listResultId = Array.from(hit, getIdFromHit);
      const listResult: AnyObject = {};
      Array.from(hit, (item: AnyObject) => {
        if (item) {
          listResult[item._source.id] = Math.round(Number(item?.fields?.distance[0]));
        }
      });
      listResultId = listResultId.filter((item) => Number(item)).filter((item) => item);
      // eslint-disable-next-line prefer-const
      // @ts-ignore
      data = (
        await this.bookmarkLocationRepository.find({
          ...BookmarkLocationInfoQuery(),
          order: filter?.order,
          where: {
            locationId: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              inq: listResultId || [],
            },
            userId,
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
        })
      ).map((item: BookmarkLocation) => {
        return {
          ...item,
          distance: listResult[item?.locationId],
        };
      });
      const result = await Promise.all(
        data.map((bookmark) =>
          this.handleReturnBookmarkWithLocationHadAttachment({
            bookmark,
            userId,
          }),
        ),
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const resultsOrdering = filter?.order ? result : sortByList(result, 'locationId', listResultId);
      return {
        count: count,
        data: resultsOrdering,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async handleReturnBookmarkWithLocationHadAttachment({
    bookmark,
    userId,
  }: {
    bookmark: BookmarkLocationWithRelations;
    userId: number;
  }): Promise<BookmarkLocationWithLocationHadAttachmentInterface> {
    try {
      // eslint-disable-next-line prefer-const
      let [location, ranking] = await Promise.all([
        this.renderMediaFromPost(bookmark?.location, userId),
        this.rankingsRepository.findOne({
          where: {
            userId,
            locationId: bookmark.locationId,
          },
        }),
      ]);
      const locationRequest = await this.locationRequestsRepository.findOne({
        order: ['createdAt DESC'],
        where: {
          locationId: bookmark.locationId,
          userId,
        },
      });
      return {
        ...bookmark,
        location: {
          ...location,
          locationRequest,
        },
        ranking,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async renderMediaFromPost(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    const [coverPost, ranking, isSavedLocation, totalPosts] = await Promise.all([
      this.postsRepository.findOne({
        where: {
          accessType: POST_ACCESS_TYPE_PUBLIC,
          locationId: location.id,
          isPublicLocation: true,
        },
        order: ['averagePoint DESC'],
        include: [
          {
            relation: 'mediaContents',
          },
        ],
      }),
      this.rankingsRepository.findOne({
        where: {
          locationId: location.id,
          userId,
        },
      }),
      this.myLocationsRepository.findOne({
        where: {
          locationId: get(location, 'id', 0),
          userId,
        },
      }),
      this.postsRepository.count({
        accessType: POST_ACCESS_TYPE_PUBLIC,
        locationId: location.id,
        isPublicLocation: true,
      }),
    ]);
    return {
      ...omit(location, ['tour']),
      isSavedLocation: Boolean(isSavedLocation),
      totalPosts: totalPosts?.count || 0,
      hadInteresting: Boolean(location?.interestings?.length),
      ...(location?.interestings?.length
        ? {
            interesting: location?.interestings[0],
          }
        : {}),
      attachments: {
        mediaContents: coverPost?.mediaContents || [],
      },
      ranking,
    };
  }

  async handleSearchingBookmarkLocation({
    filter,
    userId,
    q,
    coordinates,
    distance,
    whereLocation,
  }: {
    filter?: Filter<MyLocations>;
    userId: number;
    q?: string;
    coordinates?: string;
    distance?: number;
    whereLocation?: Where<Locations>;
  }): Promise<AnyObject> {
    const listLocationMyMap = await this.bookmarkLocationRepository.find({
      where: {
        ...filter?.where,
        userId: userId,
      },
    });
    const listLocationId = listLocationMyMap.map((item) => item.locationId).filter((item) => item);
    const musts = ELASTICwhereToMatchs({...whereLocation});
    const must: AnyObject[] = [...musts];
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
        id: listLocationId,
      },
    });
    const body: AnyObject = {
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
      ...(filter?.limit ? {size: filter?.limit} : {}),
      ...(filter?.offset ? {from: filter?.offset} : {}),
      query: {
        bool: {
          must: must,
        },
      },
    };
    if (coordinates) {
      body.sort.push({
        _geo_distance: {
          coordinates: coordinates,
          order: 'asc',
          unit: 'km',
        },
      });
      body.script_fields = {
        distance: {
          script: {
            params: parseStringToGeo(coordinates),
            source: "doc['coordinates'].arcDistance(params.lat,params.lon)",
          },
        },
      };
      body.stored_fields = ['_source'];
      if (distance) {
        body.query.bool = {
          ...body.query.bool,
          filter: {
            geo_distance: {
              distance: `${distance}m`,
              coordinates: coordinates,
            },
          },
        };
      }
    }
    const result = await this.locationsRepository.elasticService.get(body);
    if (!isEmpty(result)) {
      return result;
    }
    return {};
  }
}

export function BookmarkLocationInfoQuery() {
  return {
    include: [
      {
        relation: 'location',
      },
    ],
  };
}
