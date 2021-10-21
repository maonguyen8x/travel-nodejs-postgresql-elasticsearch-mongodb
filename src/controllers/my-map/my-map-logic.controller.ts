import {AnyObject, Filter, repository, Where} from '@loopback/repository';
import {
  MYMAP_ACCESS_TYPE,
  MYMAP_ACCESS_TYPE_FOLLOW,
  MYMAP_ACCESS_TYPE_PUBLIC,
  MYMAP_TARGET_TYPE_LOCATION,
  MYMAP_TYPE_HAD_CAME,
  MYMAP_TYPE_SAVED,
  MYMAP_TYPE_WISH_CAME,
} from '../../configs/mymap-constants';
import {POST_ACCESS_TYPE_PUBLIC} from '../../configs/post-constants';
import {Activity, Locations, MyLocations, MyLocationsRelations, MyLocationsWithRelations, Rankings} from '../../models';
import {
  ActivityBookmarkRepository,
  ActivityParticipantRepository,
  ActivityRepository,
  BookmarkLocationRepository,
  FollowRepository,
  LocationRequestsRepository,
  LocationsRepository,
  MyLocationsRepository,
  PageRepository,
  PostsRepository,
  RankingsRepository,
  ServiceRepository,
  TourRepository,
  UsersRepository,
} from '../../repositories';
import {changeAlias, parseOrderToElasticSort, parseStringToGeo} from '../../utils/handleString';
import {isEmpty, get} from 'lodash';
import {handleError} from '../../utils/handleError';
import {myMapsInfoQuery} from './my-map.controller';
import {HandleSearchResultInterface} from '../locations/location-interface';
import {LocationTypesEnum} from '../../configs/location-constant';
import {MyMapWithLocationHadAttachmentInterface} from './my-map.constant';
import omit from 'lodash/omit';
import {sortByList} from '../../utils/Array';
import {
  RANKING_ACCESS_TYPE_ACCEPTED,
  RANKING_ACCESS_TYPE_NOT_ACCEPTED,
  RANKING_TYPE_RANKING_LOCATION,
  RANKING_TYPE_RANKING_POST,
} from '../../configs/ranking-constant';
import {ELASTICwhereToMatchs} from '../../configs/utils-constant';
import {LocationActivityInterface, LocationStayInterface} from '../util/util-interface';
import {ActivityDetailResponseInterface, participantStatusEnum} from '../activities/activity.constant';
import {HttpErrors} from '@loopback/rest/dist';
import {BookmarkLocationStatusEnums} from '../bookmark-location/bookmark-location.constant';
import {convertPointRankingToPointScore} from '../../utils/common';

export class MyMapLogicController {
  constructor(
    @repository(MyLocationsRepository)
    public myLocationsRepository: MyLocationsRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(RankingsRepository)
    public rankingsRepository: RankingsRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(FollowRepository)
    public followRepository: FollowRepository,
    @repository(LocationRequestsRepository)
    public locationRequestsRepository: LocationRequestsRepository,
    @repository(TourRepository)
    public tourRepository: TourRepository,
    @repository(ServiceRepository)
    public serviceRepository: ServiceRepository,
    @repository(ActivityRepository)
    public activityRepository: ActivityRepository,
    @repository(ActivityParticipantRepository)
    public activityParticipantRepository: ActivityParticipantRepository,
    @repository(ActivityBookmarkRepository)
    public activityBookmarkRepository: ActivityBookmarkRepository,
    @repository(BookmarkLocationRepository)
    public bookmarkLocationRepository: BookmarkLocationRepository,
  ) {}

  async create(myLocations: Omit<MyLocations, 'id'>): Promise<MyLocations> {
    try {
      let result: (MyLocations & MyLocationsRelations) | null | MyLocations;
      result = await this.myLocationsRepository.findOne({
        where: {
          locationId: myLocations.locationId,
          userId: myLocations.userId,
        },
      });
      if (result) {
        throw new HttpErrors.BadRequest('THIS_LOCATION_WAS_SAVE_IN_' + result.myMapType);
      } else {
        result = await this.myLocationsRepository.create(myLocations);
        if (result.myMapType !== MYMAP_TYPE_WISH_CAME) {
          await this.updateStateMyMap(myLocations.userId, myLocations.locationId);
        }
        return result;
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async updateStateMyMap(userId: number, locationId: number): Promise<void> {
    const myLocation = await this.myLocationsRepository.findOne({
      where: {
        locationId: locationId,
        userId,
      },
    });
    const hadWrote = await this.postsRepository.isPublishedWithLocation(userId, locationId);
    if (myLocation?.id) {
      await this.myLocationsRepository.updateById(myLocation.id, {
        myMapType: hadWrote ? MYMAP_TYPE_HAD_CAME : MYMAP_TYPE_SAVED,
      });
    } else {
      await this.myLocationsRepository.create({
        myMapType: hadWrote ? MYMAP_TYPE_HAD_CAME : MYMAP_TYPE_SAVED,
        locationId: locationId,
        targetType: MYMAP_TARGET_TYPE_LOCATION,
        userId,
        accessType: MYMAP_ACCESS_TYPE_PUBLIC,
      });
    }
  }

  async handleSearchingMyMap({
    filter,
    userId,
    accessType,
    q,
    coordinates,
    distance,
    whereLocation,
  }: {
    filter?: Filter<MyLocations>;
    userId: number;
    accessType: string[];
    q?: string;
    coordinates?: string;
    distance?: number;
    whereLocation?: Where<Locations>;
  }): Promise<AnyObject> {
    const listLocationMyMap = await this.myLocationsRepository.find({
      where: {
        ...filter?.where,
        accessType: {
          inq: accessType,
        },
        userId: userId,
      },
    });
    const listLocationId = listLocationMyMap
      .map((item) => (item.targetType === 'LOCATION' ? item.locationId : null))
      .filter((item) => item);

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

  async getMyLocationByLocationIdvsUserId({
    locationId,
    userId,
  }: {
    locationId: number;
    userId: number;
  }): Promise<(MyLocations & MyLocationsRelations) | null> {
    try {
      return await this.myLocationsRepository.findOne({
        where: {
          locationId,
          userId,
        },
      });
    } catch (e) {
      return handleError(e);
    }
  }

  async find({
    id,
    userId,
    filter,
    whereLocation,
  }: {
    id: number;
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
    data: MyMapWithLocationHadAttachmentInterface[];
  }> {
    try {
      let count: number;
      const userFollowerIds = await this.followRepository.getListFollowerById(id);
      const accessType =
        userId === id
          ? MYMAP_ACCESS_TYPE
          : userFollowerIds.includes(userId)
          ? [MYMAP_ACCESS_TYPE_PUBLIC, MYMAP_ACCESS_TYPE_FOLLOW]
          : [MYMAP_ACCESS_TYPE_PUBLIC];

      const newFilter = {
        ...omit(filter, ['q', 'coordinates', 'distance', 'order']),
      };
      const listLocationSearch = await this.handleSearchingMyMap({
        filter: {
          ...newFilter,
        },
        userId: id,
        accessType,
        q: filter?.q,
        coordinates: filter?.coordinates,
        distance: filter?.distance,
        whereLocation,
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

      const data = (
        await this.myLocationsRepository.find({
          ...myMapsInfoQuery(),
          order: filter?.order,
          where: {
            locationId: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              inq: listResultId || [],
            },
            userId: id,
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
        })
      ).map((item: MyLocations) => {
        return {
          ...item,
          distance: listResult[item?.locationId],
        };
      });
      const result = await Promise.all(
        data.map((myMap: any) => this.handleReturnMyMapWithLocationHadAttachment({myMap, userId})),
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

  async handleReturnMyMapWithLocationHadAttachment({
    myMap,
    userId,
  }: {
    myMap: MyLocationsWithRelations;
    userId: number;
  }): Promise<MyMapWithLocationHadAttachmentInterface> {
    try {
      // eslint-disable-next-line prefer-const
      let [location, ranking] = await Promise.all([
        this.handleSearchResult(myMap?.location, userId),
        this.rankingsRepository.findOne({
          where: {
            userId,
            locationId: myMap.locationId,
          },
        }),
      ]);
      if (myMap?.representativePostId) {
        try {
          const post = await this.postsRepository.findOne({
            where: {
              id: myMap?.representativePostId,
              locationId: myMap.locationId,
              isPublicLocation: true,
              accessType: POST_ACCESS_TYPE_PUBLIC,
              // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
              // @ts-ignore
              deletedAt: null,
            },
            include: [
              {
                relation: 'mediaContents',
              },
            ],
          });
          if (post?.mediaContents) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            location = {
              ...location,
              attachments: {
                mediaContents: post?.mediaContents,
              },
            };
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      return {
        ...myMap,
        location: omit(location, ['tour']),
        ranking,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async renderMediaFromPost(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    const [coverPost, isSavedLocation, totalPosts] = await Promise.all([
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
    };
  }

  async renderMediaInTour(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    try {
      const tour = await this.tourRepository.findOne({
        include: [
          {
            relation: 'service',
            scope: {
              include: [
                {
                  relation: 'currency',
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
              ],
            },
          },
          {
            relation: 'location',
            scope: {
              include: [
                {
                  relation: 'interestings',
                  scope: {
                    where: {
                      userId,
                    },
                  },
                },
                {
                  relation: 'myLocations',
                  scope: {
                    where: {
                      userId,
                    },
                  },
                },
              ],
            },
          },
        ],
        where: {
          locationId: location?.id,
        },
      });
      return {
        ...tour?.location,
        ...(tour?.location?.interestings?.length && {
          interesting: tour?.location?.interestings[0],
        }),
        hadInteresting: Boolean(tour?.location?.interestings?.length),
        isSavedLocation: Boolean(tour?.location?.myLocations?.length),
        name: tour?.service?.name,
        pageId: tour?.service?.pageId,
        serviceId: tour?.service?.id,
        attachments: {
          mediaContents: tour?.service?.post?.mediaContents || [],
        },
        tour: {
          id: tour?.id,
          currency: tour?.service?.currency,
          currencyId: tour?.service?.currencyId,
          tourName: tour?.service?.name,
          price: tour?.service?.price,
          destinations: tour?.destinations,
          totalTourTime: tour?.totalTourTime,
          totalRanking: tour?.location?.totalReview || 0,
          vehicleServices: tour?.vehicleServices?.map((item) => item.value),
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async renderMediaFromPage(location: Locations, userId: number): Promise<HandleSearchResultInterface> {
    const [page, isSavedLocation] = await Promise.all([
      this.pageRepository.findOne({
        where: {
          locationId: location.id,
        },
        include: [
          {
            relation: 'background',
          },
        ],
      }),
      this.myLocationsRepository.findOne({
        where: {
          locationId: get(location, 'id', 0),
          userId,
        },
      }),
    ]);
    return {
      ...omit(location, ['tour']),
      isSavedLocation: Boolean(isSavedLocation),
      hadInteresting: Boolean(location?.interestings?.length),
      ...(location?.interestings?.length
        ? {
            interesting: location?.interestings[0],
          }
        : {}),
      pageId: page?.id,
      attachments: {
        mediaContents: page?.background ? [page?.background] : [],
      },
    };
  }

  async renderDataActivity(location: Locations, userId: number): Promise<LocationActivityInterface> {
    try {
      const activity = await this.findOneActivity({
        filter: {
          where: {
            locationId: location.id,
          },
        },
        userId,
      });
      return {
        ...location,
        ...(activity
          ? {
              activity,
              name: activity.name,
            }
          : {}),
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        post: activity?.post,
        attachments: {
          mediaContents: activity?.post?.mediaContents || [],
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findOneActivity({
    filter,
    userId,
  }: {
    userId: number;
    filter?: Filter<Activity>;
  }): Promise<ActivityDetailResponseInterface | null> {
    try {
      const activity = await this.activityRepository.findOne({
        ...filter,
        include: [
          {
            relation: 'currency',
          },
          {
            relation: 'location',
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
        ],
      });
      if (activity) {
        const participantCount = await this.activityParticipantRepository.count({
          activityId: activity.id,
          status: {
            nin: [participantStatusEnum.remove],
          },
        });
        const joined = await this.activityParticipantRepository.findOne({
          where: {
            activityId: activity.id,
            userId,
            status: {
              nin: [participantStatusEnum.remove],
            },
          },
        });
        return {
          mediaContents: activity?.post?.mediaContents || [],
          introduction: activity?.post?.content,
          ...activity,
          currency: activity?.currency,
          participantCount: participantCount.count,
          joined: Boolean(joined),
        };
      } else {
        return null;
      }
    } catch (e) {
      return handleError(e);
    }
  }

  async renderDataStay(location: Locations, userId: number): Promise<LocationStayInterface> {
    try {
      const page = await this.pageRepository.findOne({
        where: {
          locationId: location.id,
        },
      });
      const service = await this.serviceRepository.findOne({
        where: {
          pageId: get(page, 'id', 0),
        },
        order: ['price ASC'],
        include: [
          {
            relation: 'currency',
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
          {
            relation: 'stay',
            scope: {
              include: [
                {
                  relation: 'accommodationType',
                },
              ],
            },
          },
        ],
      });
      return {
        ...location,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        page,
        name: get(page, 'name'),
        service,
        pageId: get(page, 'id'),
        serviceId: service?.id,
        ...(get(service, 'stay')
          ? {
              stay: get(service, 'stay'),
            }
          : {}),
        hadInteresting: Boolean(location?.interestings?.length),
        attachments: {
          mediaContents: get(service, ['post', 'mediaContents'], []),
        },
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async handleSearchResult(
    location: Locations,
    userId = 0,
  ): Promise<HandleSearchResultInterface | LocationActivityInterface> {
    const objectReturn = {
      [String(LocationTypesEnum.where)]: () => {
        return this.renderMediaFromPost(location, userId);
      },
      [String(LocationTypesEnum.tour)]: () => {
        return this.renderMediaInTour(location, userId);
      },
      [String(LocationTypesEnum.stay)]: () => {
        return this.renderMediaFromPage(location, userId);
      },
      [String(LocationTypesEnum.food)]: () => {
        return this.renderMediaFromPage(location, userId);
      },
      [String(LocationTypesEnum.activity)]: () => {
        return this.renderDataActivity(location, userId);
      },
      [String(LocationTypesEnum.stay)]: () => {
        return this.renderDataStay(location, userId);
      },
    };
    return objectReturn[String(location.locationType)] && objectReturn[String(location.locationType)]();
  }

  async deleteById(
    id: number,
    userId: number,
  ): Promise<{
    message: string;
  }> {
    try {
      const current = await this.myLocationsRepository.findById(id);
      await this.myLocationsRepository.deleteAll({
        userId,
        id,
      });
      if (current.myMapType === MYMAP_TYPE_HAD_CAME) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleRemoveLocationIdFromPost(current.locationId, userId);
      }
      return {
        message: 'Remove item from my map successful',
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
    await this.updateAcceptRanking(userId, locationId, RANKING_ACCESS_TYPE_NOT_ACCEPTED);
    await this.bookmarkLocationRepository.updateAll(
      {
        status: BookmarkLocationStatusEnums.unpublished,
      },
      {
        locationId,
        userId,
      },
    );
    // TODO: Not yet update total review
    // await this.updateTotalReview(locationId);
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

  async updateAcceptRanking(userId: number, locationId: number, rankingAccessType: string): Promise<void> {
    const target = await this.rankingsRepository.findOne({
      where: {
        userId: userId,
        locationId: locationId,
      },
    });
    if (target?.id) {
      await this.rankingsRepository.updateById(target.id, {
        rankingAccessType: rankingAccessType,
      });
      await this.updateRankingPoint(target);
    }
  }

  async updateRankingPoint(ranking: Rankings): Promise<void> {
    let _score = 0;
    let _averagePoint = 0;
    if (ranking.rankingType === RANKING_TYPE_RANKING_LOCATION && ranking.locationId) {
      const listRanking = await this.rankingsRepository.find({
        where: {
          locationId: ranking.locationId,
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
      await this.locationsRepository.updateById(ranking.locationId, {
        score: _score,
        averagePoint: _averagePoint,
        totalReview: listRanking.length,
      });
    }
    if (ranking.rankingType === RANKING_TYPE_RANKING_POST && ranking.postId) {
      const listRanking = await this.rankingsRepository.find({
        where: {
          postId: ranking.postId,
          rankingType: RANKING_TYPE_RANKING_POST,
          rankingAccessType: RANKING_ACCESS_TYPE_ACCEPTED,
        },
      });
      if (listRanking.length) {
        listRanking.map((item) => {
          _averagePoint += item.point || 0;
        });
        _averagePoint = Math.round(_averagePoint / listRanking.length);
      }
      await this.postsRepository.updateById(ranking.postId, {
        averagePoint: _averagePoint,
        totalRanking: listRanking.length,
      });
    }
  }
}
