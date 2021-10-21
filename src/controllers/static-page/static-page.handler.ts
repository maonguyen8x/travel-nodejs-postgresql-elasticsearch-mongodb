import {repository, Filter} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {StaticPage} from '../../models';
import {StaticPageRepository} from '../../repositories';
import {handleError} from '../../utils/handleError';
import {ErrorCode} from '../../constants/error.constant';

export class StaticPageHandler {
  constructor(
    @repository(StaticPageRepository)
    public staticPageRepository: StaticPageRepository,
  ) {}

  async find(filter?: Filter<StaticPage>): Promise<{count: number; data: StaticPage[]}> {
    const data = await this.staticPageRepository.find(filter);
    const Count = await this.staticPageRepository.count(filter?.where);

    return {data, count: Count.count};
  }

  async findByAlisa(alias: string): Promise<StaticPage> {
    try {
      const staticPage = await this.staticPageRepository.findOne({
        where: {alias},
      });

      if (!staticPage) throw new HttpErrors.NotFound(ErrorCode.OBJECT_NOT_FOUND);

      return staticPage;
    } catch (error) {
      return handleError(error);
    }
  }
}
