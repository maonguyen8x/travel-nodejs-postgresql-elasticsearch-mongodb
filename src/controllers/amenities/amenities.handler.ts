import {repository, Filter} from '@loopback/repository';
import {AmenityCategoryRepository} from '../../repositories';
import {AmenityCategory} from '../../models';
import {handleError} from '../../utils/handleError';

export class AmenitiesHandler {
  constructor(
    @repository(AmenityCategoryRepository)
    public amenityCategoryRepository: AmenityCategoryRepository,
  ) {}

  async find({
    filter,
  }: {
    filter?: Filter<AmenityCategory>;
  }): Promise<{
    count: number;
    data: AmenityCategory[];
  }> {
    try {
      const [{count}, data] = await Promise.all([
        this.amenityCategoryRepository.count(filter?.where),
        this.amenityCategoryRepository.find({
          ...filter,
          include: [
            {
              relation: 'amenities',
            },
          ],
        }),
      ]);
      return {count, data};
    } catch (e) {
      return handleError(e);
    }
  }
}
