import {repository, Filter} from '@loopback/repository';
import {FacilityCategoryRepository} from '../../repositories';
import {FacilityCategory} from '../../models';
import {handleError} from '../../utils/handleError';

export class FacilitiesHandler {
  constructor(
    @repository(FacilityCategoryRepository)
    public facilityCategoryRepository: FacilityCategoryRepository,
  ) {}

  async create(facilityCategory: Omit<FacilityCategory, 'id'>): Promise<FacilityCategory> {
    try {
      const result = await this.facilityCategoryRepository.create({
        name: facilityCategory.name,
      });
      const promise = facilityCategory.facilities.map(async (item) => {
        const facility = {
          name: item.name,
          facilityCategoryId: result.id,
          keyword: item.keyword,
        };
        return this.facilityCategoryRepository.facilities(result.id).create({
          ...facility,
        });
      });
      await Promise.all(promise);
      return result;
    } catch (e) {
      return handleError(e);
    }
  }

  async find({
    filter,
  }: {
    filter?: Filter<FacilityCategory>;
  }): Promise<{
    count: number;
    data: FacilityCategory[];
  }> {
    try {
      const [count, data] = await Promise.all([
        this.facilityCategoryRepository.count(filter?.where),
        this.facilityCategoryRepository.find({
          ...filter,
          include: [
            {
              relation: 'facilities',
            },
          ],
        }),
      ]);
      return {
        count: count.count,
        data,
      };
    } catch (e) {
      return handleError(e);
    }
  }
}
