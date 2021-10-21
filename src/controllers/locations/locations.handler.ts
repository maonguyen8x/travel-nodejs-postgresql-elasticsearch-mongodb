import {repository, Filter, AnyObject, IsolationLevel} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {
  LocationRequests,
  LocationsWithRelations,
  MaterializedViewLocations,
  PageReview,
  ServiceReview,
} from '../../models';
import {
  LocationsRepository,
  LocationRequestsRepository,
  MaterializedViewLocationsRepository,
  InterestingRepository,
  PageRepository,
  PageReviewRepository,
  ServiceReviewRepository,
} from '../../repositories';
import {TRANSACTION_TIMEOUT} from '../../constants/variable.constant';
import {concatStringForElastic} from '../../utils/handleString';
import {handleError} from '../../utils/handleError';
import {ILocationChangeRequest, LocationChangeRequestStatus, LOCATION_OPTIONS} from './locations.constant';
import {ErrorCode} from '../../constants/error.constant';
import {inject} from '@loopback/context';
import {NotificationLogicController} from '..';
import {ILocationSearchInput, ILocationResponse, ITourOfLocation} from './location-interface';
import {UserProfile, securityId} from '@loopback/security';
import {LocationsLogicController} from './locations-logic.controller';
import {omit, isEmpty, get, pick, compact, sumBy} from 'lodash';
import {LocationIsFullEnum, LocationTypesEnum} from '../../configs/location-constant';
import Decimal from 'decimal.js';

export class LocationsHandler {
  constructor(
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(LocationRequestsRepository)
    public locationRequestsRepository: LocationRequestsRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
    @inject('controllers.LocationsLogicController')
    public locationsLogicController: LocationsLogicController,
    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
    @repository(InterestingRepository)
    public interestingRepository: InterestingRepository,
    @repository(PageRepository) public pageRepository: PageRepository,
    @repository(PageReviewRepository)
    public pageReviewRepository: PageReviewRepository,
    @repository(ServiceReviewRepository)
    public serviceReviewRepository: ServiceReviewRepository,
  ) {}

  async changeRequest(id: number, body: ILocationChangeRequest): Promise<{success: boolean}> {
    const transaction = await this.locationRequestsRepository.beginTransaction({
      isolationLevel: IsolationLevel.READ_COMMITTED,
      timeout: TRANSACTION_TIMEOUT,
    });

    try {
      const location = await this.locationsRepository.findOne({
        where: {id, userId: body.userId},
        include: [
          {
            relation: 'creator',
            scope: {
              include: [{relation: 'email'}],
            },
          },
        ],
      });

      if (!location) throw new HttpErrors.NotFound(ErrorCode.OBJECT_NOT_FOUND);

      // add case check duplicate name location
      // eslint-disable-next-line no-unused-expressions
      location.name?.localeCompare(body.name) !== 0 && (await this.locationsRepository.checkDublicateName(body.name));
      const result = await this.locationRequestsRepository.create(body, {transaction});
      await this.locationRequestsRepository.elasticService.create({
        id: result.id,
        status: result.status,
        name: result.name,
        address: result.address,
        userId: result.userId,
        locationId: id,
        createdAt: result.createdAt,
        search: concatStringForElastic(
          result?.name,
          result?.address,
          location?.creator?.name,
          location?.creator?.email?.email,
        ),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.notificationLogicController.notifyForAdmin({
        locationRequests: result,
      });
      await transaction.commit();
      return {success: true};
    } catch (error) {
      await transaction.rollback();
      return handleError(error);
    }
  }

  async findChangeRequests(filter?: Filter<LocationRequests>): Promise<{count: number; data: LocationRequests[]}> {
    try {
      const locationRequests = await this.locationRequestsRepository.find(filter);
      const Count = await this.locationRequestsRepository.count(filter?.where);

      return {count: Count.count, data: locationRequests};
    } catch (error) {
      return handleError(error);
    }
  }

  async updateStatusChangeRequest(
    id: number,
    body: {status: LocationChangeRequestStatus},
  ): Promise<{success: boolean}> {
    try {
      const validStatus = [LocationChangeRequestStatus.ACCEPTED, LocationChangeRequestStatus.REJECTED];
      if (!validStatus.includes(body.status)) {
        return handleError(new HttpErrors.NotFound(ErrorCode.BAD_REQUEST));
      }
      const locationRequest = await this.locationRequestsRepository.findOne({
        where: {
          id,
          status: LocationChangeRequestStatus.REQUESTED,
        },
      });
      if (!locationRequest) throw new HttpErrors.NotFound(ErrorCode.OBJECT_NOT_FOUND);
      if (body.status === LocationChangeRequestStatus.ACCEPTED) {
        const locationBody = {
          coordinates: locationRequest.coordinates,
          name: locationRequest.name,
          formatedAddress: locationRequest.formatedAddress,
          country: locationRequest.country,
          areaLevel1: locationRequest.areaLevel1,
          areaLevel2: locationRequest.areaLevel2,
          areaLevel3: locationRequest.areaLevel3,
          areaLevel4: locationRequest.areaLevel4,
          areaLevel5: locationRequest.areaLevel5,
          locationType: locationRequest.locationType,
          address: locationRequest.address,
        };
        await this.locationsRepository.updateById(locationRequest.locationId, locationBody);
      }
      await this.locationRequestsRepository.updateById(locationRequest.id, body);
      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteChangeRequest(locationId: number, userId: number): Promise<{success: boolean}> {
    try {
      await this.locationRequestsRepository.deleteAll({
        locationId,
        userId,
      });
      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async formatLocation(
    materViewlocations: MaterializedViewLocations[],
    userProfile?: UserProfile,
  ): Promise<ILocationResponse[]> {
    try {
      const locationsIds = materViewlocations.map((el) => el.id || 0);

      const interestings = userProfile
        ? await this.interestingRepository.find({
            where: {
              userId: parseInt(userProfile[securityId]),
              locationId: {
                inq: locationsIds,
              },
            },
          })
        : [];

      const result = materViewlocations.map((item, index) => {
        const location = pick(item, LOCATION_OPTIONS.select);
        const locationType = location.locationType || LocationTypesEnum.where;
        const nameLocation = {
          [LocationTypesEnum.where.toString()]: item.name,
          [LocationTypesEnum.tour.toString()]: item.tourName,
          [LocationTypesEnum.food.toString()]: item.name,
        };

        const mediaContents = {
          [LocationTypesEnum.where.toString()]: item.postMedias || [],
          [LocationTypesEnum.tour.toString()]: item.tourMedias || [],
          [LocationTypesEnum.food.toString()]: item.backgroundMedia ? [item.backgroundMedia] : [],
        };

        const serviceIds = {
          [LocationTypesEnum.food.toString()]: item.tourServiceId,
        };
        const tour: ITourOfLocation = {
          id: item.tourId,
          currency: {
            id: item.tourCurrencyId,
            code: item.tourCurrencyCode,
            symbol: item.tourCurrencySymbol,
            text: item.tourCurrencyText,
          },
          currencyId: item.tourCurrencyId,
          name: item.tourName,
          price: item.tourPrice,
          destinations: item.tourDestinations,
          totalTourTime: item.totalTourTime,
          vehicleServices: item.tourVehicleServices?.map((el) => el.value),
        };

        return {
          ...location,
          name: nameLocation[locationType],
          attachments: {mediaContents: mediaContents[locationType]},
          pageId: item.pageId,
          tour: locationType === LocationTypesEnum.tour ? tour : undefined,
          hadInteresting: interestings.find((element) => element.locationId === location.id) ? true : false,
          servideId: serviceIds[locationType],
        };
      });

      return result;
    } catch (error) {
      return handleError(error);
    }
  }

  async searchAll(
    locationSearch: ILocationSearchInput,
    userProfile?: UserProfile,
  ): Promise<{data: AnyObject[]; count: number}> {
    try {
      const filter = omit(locationSearch, ['q', 'isFull', 'coordinates', 'distance']);
      const searchResult = await this.locationsLogicController.search(
        filter,
        locationSearch?.q,
        locationSearch?.coordinates,
        locationSearch?.distance,
        locationSearch?.isFull && JSON.parse(String(locationSearch?.isFull).toLowerCase())
          ? LocationIsFullEnum.full
          : LocationIsFullEnum.normal,
        locationSearch?.filterActivity,
        locationSearch?.filterTour,
        locationSearch?.searchType,
      );

      if (isEmpty(searchResult)) return {data: [], count: 0};

      const count: number = get(searchResult, 'body.hits.total.value', 0);
      const hit = get(searchResult, 'body.hits.hits', []);
      const getIdFromHit = (item: {_source: {id: number}}) => get(item, '_source.id', 0);
      const locationIds: number[] = hit
        .map((el: {_source: {id: number}}) => getIdFromHit(el))
        .filter((el: number) => el);

      const locations = await this.materializedViewLocationsRepository.find({
        where: {id: {inq: locationIds}},
      });

      const dataLocations = locationIds.map((locationId) => {
        return locations.find((item) => item.id === locationId);
      });

      return {
        count,
        data: await this.formatLocation(compact(dataLocations), userProfile),
      };
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteLocationById(locationId: number): Promise<void> {
    await this.locationsRepository.deleteById(locationId);
  }

  async updateAveragePoint(updateAveragePointTime: string): Promise<{success: boolean}> {
    try {
      const records = await this.locationsRepository.find({
        where: {
          updatedAveragePointAt: {lt: updateAveragePointTime},
          locationType: {neq: LocationTypesEnum.where},
        },
        include: [
          {
            relation: 'page',
          },
          {
            relation: 'tour',
          },
        ],
      });

      if (!records.length) return {success: true};

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(async () => {
          await this.findOneAndUpdateAveragePoint(record, updateAveragePointTime);
        }, i * 200);
      }

      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async findOneAndUpdateAveragePoint(
    record: LocationsWithRelations,
    updateAveragePointTime: string,
  ): Promise<{success: boolean}> {
    try {
      const point = {totalReview: 0, averagePoint: 0};
      if (!record || !record.id) return {success: true};

      if (
        (record.locationType === LocationTypesEnum.stay ||
          record.locationType === LocationTypesEnum.food ||
          record.locationType === LocationTypesEnum.tour) &&
        !!record.page
      ) {
        const page = await this.pageRepository.findOne({
          where: {locationId: record.id},
        });
        const {totalReview, averagePoint} = await this.calculateAveragePointPage(page?.id);
        point.averagePoint = averagePoint;
        point.totalReview = totalReview;
      }

      if (record.locationType === LocationTypesEnum.tour && !!record.tour) {
        const {totalReview, averagePoint} = await this.calculateAveragePointService(record.tour.serviceId);
        point.averagePoint = averagePoint;
        point.totalReview = totalReview;
      }

      // not yet
      if (record.locationType === LocationTypesEnum.where) {
        // will impelement in future
        return {success: true};
      }

      const newAveragePoint = new Decimal(point.averagePoint);
      const oldAveragePoint = new Decimal(record.averagePoint || 0);
      const newTotalReview = new Decimal(point.totalReview);
      const oldTotalReview = new Decimal(record.totalReview || 0);
      const isDifferent = !newAveragePoint.equals(oldAveragePoint) || !newTotalReview.equals(oldTotalReview);

      if (isDifferent) {
        await this.locationsRepository.updateById(record.id, {
          ...point,
          updatedAveragePointAt: updateAveragePointTime,
        });
      }

      return {success: true};
    } catch (error) {
      return handleError(error);
    }
  }

  async calculateAveragePointPage(pageId?: number): Promise<{totalReview: number; averagePoint: number}> {
    try {
      if (!pageId) return {totalReview: 0, averagePoint: 0};

      const filter: Filter<PageReview> = {
        where: {pageId},
        fields: {point: true},
      };
      const [{count}, records] = await Promise.all([
        this.pageReviewRepository.count(filter.where),
        this.pageReviewRepository.find(filter),
      ]);

      if (!count) return {totalReview: 0, averagePoint: 0};

      const totalPoint = sumBy(records, (record) => record.point);
      const averagePoint = Decimal.div(totalPoint, count).toNumber();

      return {totalReview: count, averagePoint};
    } catch (error) {
      return handleError(error);
    }
  }

  async calculateAveragePointService(serviceId?: number): Promise<{totalReview: number; averagePoint: number}> {
    try {
      if (!serviceId) return {totalReview: 0, averagePoint: 0};

      const filter: Filter<ServiceReview> = {
        where: {serviceId},
        fields: {point: true},
      };
      const [{count}, records] = await Promise.all([
        this.serviceReviewRepository.count(filter.where),
        this.serviceReviewRepository.find(filter),
      ]);

      if (!count) return {totalReview: 0, averagePoint: 0};

      const totalPoint = sumBy(records, (record) => record.point);
      const averagePoint = Decimal.div(totalPoint, count).toNumber();

      return {totalReview: count, averagePoint};
    } catch (error) {
      return handleError(error);
    }
  }
}
