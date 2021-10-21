import {Getter, inject} from '@loopback/core';
import {
  AnyObject,
  BelongsToAccessor,
  Count,
  DeepPartial,
  DefaultTransactionalRepository,
  Filter,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
  repository,
  Where,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {ElasticSearchServiceBindings} from '../keys';
import {
  Activity,
  Interesting,
  Locations,
  LocationsRelations,
  LocationsWithRelations,
  MyLocations,
  Page,
  Posts,
  Rankings,
  Tour,
  Users,
} from '../models';
import {ElasticSearchService} from '../services';
import {changeAlias, convertToNFD, parseStringToGeo, titleCase, concatStringForElastic} from '../utils/handleString';
import {PostsRepository} from './posts.repository';
import {RankingsRepository} from './rankings.repository';
import {UsersRepository} from './users.repository';
import _, {omit} from 'lodash';
import {handleError} from '../utils/handleError';
import {MaterializedViewLocationsRepository} from './materialized-view-locations.repository';
import {MyLocationsRepository} from './my-locations.repository';
import {ErrorCode} from '../constants/error.constant';
import {InterestingRepository} from './interesting.repository';
import {ActivityRepository} from './activity.repository';
import dayjs from 'dayjs';
import {PageRepository} from './page.repository';
import {TourRepository} from './tour.repository';
import Decimal from 'decimal.js';
import {LocationTypesEnum} from '../configs/location-constant';
import {generateAddress} from '../utils/location.util';

/* My friend was fired on 1601683200, i miss her
 *  Please dont change this variable
 */

const TIMELINE_CONSTANT = 1601683200;

export class LocationsRepository extends DefaultTransactionalRepository<
  Locations,
  typeof Locations.prototype.id,
  LocationsRelations
> {
  public readonly posts: HasManyRepositoryFactory<Posts, typeof Locations.prototype.id>;

  public readonly rankings: HasManyRepositoryFactory<Rankings, typeof Locations.prototype.id>;

  public readonly creator: BelongsToAccessor<Users, typeof Locations.prototype.id>;

  public readonly myLocations: HasManyRepositoryFactory<MyLocations, typeof Locations.prototype.id>;

  public readonly interestings: HasManyRepositoryFactory<Interesting, typeof Locations.prototype.id>;

  public readonly activity: HasOneRepositoryFactory<Activity, typeof Locations.prototype.id>;
  public readonly page: HasOneRepositoryFactory<Page, typeof Locations.prototype.id>;
  public readonly tour: HasOneRepositoryFactory<Tour, typeof Locations.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('PostsRepository')
    protected postsRepositoryGetter: Getter<PostsRepository>,
    @repository.getter('RankingsRepository')
    protected rankingsRepositoryGetter: Getter<RankingsRepository>,
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
    @repository.getter('MyLocationsRepository')
    protected myLocationsRepositoryGetter: Getter<MyLocationsRepository>,
    @repository.getter('InterestingRepository')
    protected interestingRepositoryGetter: Getter<InterestingRepository>,
    @repository.getter('PageRepository')
    protected pageRepositoryGetter: Getter<PageRepository>,

    @repository.getter('ActivityRepository')
    protected activityRepositoryGetter: Getter<ActivityRepository>,
    @repository.getter('TourRepository')
    protected tourRepositoryGetter: Getter<TourRepository>,
  ) {
    super(Locations, dataSource);
    this.activity = this.createHasOneRepositoryFactoryFor('activity', activityRepositoryGetter);
    this.registerInclusionResolver('activity', this.activity.inclusionResolver);

    this.interestings = this.createHasManyRepositoryFactoryFor('interestings', interestingRepositoryGetter);
    this.registerInclusionResolver('interestings', this.interestings.inclusionResolver);

    this.myLocations = this.createHasManyRepositoryFactoryFor('myLocations', myLocationsRepositoryGetter);
    this.registerInclusionResolver('myLocations', this.myLocations.inclusionResolver);

    this.creator = this.createBelongsToAccessorFor('creator', usersRepositoryGetter);
    this.registerInclusionResolver('creator', this.creator.inclusionResolver);

    this.rankings = this.createHasManyRepositoryFactoryFor('rankings', rankingsRepositoryGetter);
    this.registerInclusionResolver('rankings', this.rankings.inclusionResolver);

    this.posts = this.createHasManyRepositoryFactoryFor('posts', postsRepositoryGetter);
    this.registerInclusionResolver('posts', this.posts.inclusionResolver);

    this.page = this.createHasOneRepositoryFactoryFor('page', pageRepositoryGetter);
    this.registerInclusionResolver('page', this.page.inclusionResolver);

    this.tour = this.createHasOneRepositoryFactoryFor('tour', tourRepositoryGetter);
    this.registerInclusionResolver('tour', this.tour.inclusionResolver);

    this.elasticService.setIndex(String(Locations.definition.name).toLowerCase());
  }

  async create(
    entity: Partial<Locations> | {[P in keyof Locations]?: DeepPartial<Locations[P]>} | Locations,
    options?: AnyObject,
  ): Promise<Locations> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      this.validate(entity);
      // eslint-disable-next-line no-unused-expressions
      if (
        entity.locationType !== LocationTypesEnum.activity.toString() &&
        entity.locationType !== LocationTypesEnum.google.toString()
      ) {
        await this.checkDublicateName(entity.name);
      }
      const {lat, lon} = parseStringToGeo(entity.coordinates || '');
      const result = await super.create(
        {
          ...entity,
          address: generateAddress(entity),
          formatedAddress: generateAddress(entity),
          createdAt: moment().utc().toISOString(),
          updatedAt: moment().utc().toISOString(),
          latitude: lat,
          longitude: lon,
          score: 0,
        },
        options,
      );
      await this.elasticService.create({
        ...result,
        name: changeAlias(result.name || ''),
        originalName: result.name || '',
        country: changeAlias(result.country || '').trim(),
        originalCountry: result.country || '',
        areaLevel1: changeAlias(result.areaLevel1 || '').trim(),
        originalAreaLevel1: result.areaLevel1 || '',
        areaLevel2: changeAlias(result.areaLevel2 || ''),
        areaLevel3: changeAlias(result.areaLevel3 || ''),
        areaLevel4: changeAlias(result.areaLevel4 || ''),
        areaLevel5: changeAlias(result.areaLevel5 || ''),
        address: changeAlias(generateAddress(result)),
        originalAddress: generateAddress(result),
        formatedAddress: changeAlias(generateAddress(result)),
        id: result.id,
        coordinates: parseStringToGeo(result.coordinates || ''),
        deletedAt: result.deletedAt,
        blockedAt: result.blockedAt,
        isDuplicated: result.isDuplicated,
        search: changeAlias(concatStringForElastic(result.id, result.name, result.address)),
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async updateById(
    id: typeof Locations.prototype.id,
    data: Partial<Locations> | {[P in keyof Locations]?: DeepPartial<Locations[P]>} | Locations,
    options?: AnyObject,
  ): Promise<void> {
    try {
      const location = await this.findById(id);
      const newData = {
        ...omit(location, ['id']),
        ...data,
      };
      if (data.coordinates) {
        this.validate({...data});
        const {lat, lon} = parseStringToGeo(newData.coordinates || '');
        newData.latitude = lat;
        newData.longitude = lon;
      }
      await super.updateById(
        id,
        {
          ...newData,
          address: generateAddress(newData),
          formatedAddress: generateAddress(newData),
          updatedAt: moment().utc().toISOString(),
        },
        options,
      );
      const result = await this.findById(id);
      await this.handleUpdateElasticSearch(result, id, options);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.materializedViewLocationsRepository.refeshMaterializedViewLocations();
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById(id: typeof Locations.prototype.id, options?: AnyObject): Promise<void> {
    await Promise.all([super.deleteById(id), this.elasticService.deleteById(id)]);
  }

  find(filter?: Filter<Locations>, options?: AnyObject): Promise<LocationsWithRelations[]> {
    return super.find(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
          blockedAt: {eq: null},
        },
      },
      options,
    );
  }

  count(where?: Where<Locations>): Promise<Count> {
    return super.count({
      ...where,
      deletedAt: {eq: null},
      blockedAt: {eq: null},
    });
  }

  findOne(filter?: Filter<Locations>, options?: AnyObject): Promise<LocationsWithRelations | null> {
    return super.findOne(
      {
        ...filter,
        where: {
          ...filter?.where,
          deletedAt: {eq: null},
          blockedAt: {eq: null},
        },
      },
      options,
    );
  }

  async deleteLocationWhereById(id: typeof Locations.prototype.id, options?: AnyObject): Promise<void> {
    const location = await super.findById(id);
    if (!location.isPublished && location.locationType === LocationTypesEnum.where) {
      await Promise.all([super.deleteById(location.id), this.elasticService.deleteById(location.id)]);
    }
  }

  async handleUpdateElasticSearch(result: Locations, id?: number, option?: object): Promise<void> {
    await this.elasticService
      .updateById(
        {
          id: result.id,
          name: changeAlias(result.name || ''),
          originalName: result.name || '',
          country: changeAlias(result.country || '').trim(),
          originalCountry: result.country || '',
          areaLevel1: changeAlias(result.areaLevel1 || '').trim(),
          originalAreaLevel1: result.areaLevel1 || '',
          areaLevel2: changeAlias(result.areaLevel2 || ''),
          areaLevel3: changeAlias(result.areaLevel3 || ''),
          areaLevel4: changeAlias(result.areaLevel4 || ''),
          areaLevel5: changeAlias(result.areaLevel5 || ''),
          address: changeAlias(generateAddress(result)),
          originalAddress: generateAddress(result),
          formatedAddress: changeAlias(generateAddress(result)),
          coordinates: parseStringToGeo(result.coordinates || ''),
          status: result.status,
          isPublished: result.isPublished,
          locationType: result.locationType,
          totalReview: result.totalReview,
          averagePoint: Math.round(Number(result.averagePoint)),
          createdAt: result.createdAt,
          userId: result.userId,
          deletedAt: result.deletedAt,
          blockedAt: result.blockedAt,
          score: result.score,
          isDuplicated: result.isDuplicated,
          search: changeAlias(concatStringForElastic(result.id, result.name, result.address)),
          ...option,
        },
        id,
      )
      .catch((err) => handleError(err));
  }

  algorithmScore(
    location: Partial<Locations> | {[P in keyof Locations]?: DeepPartial<Locations[P]>} | Locations,
  ): number {
    const {totalReview = 0, averagePoint = 0, updatedAt} = location;
    const updatedAtUnix = updatedAt ? dayjs.utc(updatedAt).unix() : dayjs.utc().unix();
    const second = Decimal.log10(updatedAtUnix - TIMELINE_CONSTANT).toNumber();
    const totalReviewScore = totalReview ? Decimal.log2(totalReview).toNumber() : 0;
    const averagePointScore = averagePoint ? Decimal.log2(averagePoint).toNumber() : 0;

    return new Decimal(totalReviewScore).plus(averagePointScore).plus(second).toNumber();
  }

  validate(data: Partial<Locations> | {[P in keyof Locations]?: DeepPartial<Locations[P]>} | Locations) {
    if (
      !data.coordinates ||
      _.isNaN(Number(data.coordinates.split(',')[0].trim())) ||
      _.isNaN(Number(data.coordinates.split(',')[1].trim()))
    )
      throw new HttpErrors.BadRequest('Invalid coordinates');
  }

  async checkDublicateName(name: string | undefined): Promise<void> {
    if (name) {
      const location = await super.findOne({
        where: {
          name,
        },
      });
      if (location) {
        throw new HttpErrors.Conflict(ErrorCode.CONFLICT_LOCATION_NAME);
      }
    }
  }

  async isRatedLocation(locationId: number, userId: number): Promise<boolean> {
    const ranking = await this.rankings(locationId).find({
      where: {
        userId,
        locationId,
      },
    });
    return Boolean(ranking?.length);
  }

  async updateIsDuplicateInLocation(locations: AnyObject): Promise<void> {
    // check if location will be duplicated
    const existLocations = await super.find({
      where: {
        address: {
          inq: [
            locations.address,
            locations.address.toUpperCase(),
            convertToNFD(locations.address).toUpperCase(),
            locations.address.toLocaleLowerCase(),
            convertToNFD(locations.address).toLocaleLowerCase(),
            titleCase(locations.address),
            convertToNFD(titleCase(locations.address)),
          ],
        },
      },
    });
    // handle update property of list exist location
    existLocations.map(async (item) => {
      await super.updateById(item.id, {
        ...item,
        isDuplicated: true,
      });
    });
  }
}
