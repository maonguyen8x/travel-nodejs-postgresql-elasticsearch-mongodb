import {Filter, repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {Currency} from '../models';
import {CurrencyRepository} from '../repositories';

export class CurrencyController {
  constructor(
    @repository(CurrencyRepository)
    public currencyRepository: CurrencyRepository,
  ) {}

  @get('/currencies', {
    responses: {
      '200': {
        description: 'Array of Currency model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Currency),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Currency, {name: 'filterCurrencies'})
    filter?: Filter<Currency>,
  ): Promise<Currency[]> {
    return this.currencyRepository.find(filter);
  }
}
