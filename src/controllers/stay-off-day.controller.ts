import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {post, param, get, getModelSchemaRef, patch, del, requestBody} from '@loopback/rest';
import {StayOffDay} from '../models';
import {StayOffDayRepository, StayRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_CUSTOMER} from '../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import dayjs = require('dayjs');

export class StayOffDayController {
  constructor(
    @repository(StayOffDayRepository)
    public stayOffDayRepository: StayOffDayRepository,
    @repository(StayRepository)
    public stayRepository: StayRepository,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @post('/stay-off-days', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'StayOffDay model instance',
        content: {'application/json': {schema: getModelSchemaRef(StayOffDay)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(StayOffDay, {
            title: 'NewStayOffDay',
            exclude: ['id'],
          }),
        },
      },
    })
    stayOffDay: Omit<StayOffDay, 'id'>,
  ): Promise<StayOffDay> {
    const result = await this.stayOffDayRepository.create(stayOffDay);
    await this.handleUpdateDayOffStay(result.serviceId);
    return result;
  }

  // @get('/stay-off-days/count', {
  //   responses: {
  //     '200': {
  //       description: 'StayOffDay model count',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async count(
  //   @param.where(StayOffDay) where?: Where<StayOffDay>,
  // ): Promise<Count> {
  //   return this.stayOffDayRepository.count(where);
  // }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/stay-off-days', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of StayOffDay model instances',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: getModelSchemaRef(StayOffDay),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(StayOffDay, {name: 'filterStayOffDay'})
    filter?: Filter<StayOffDay>,
  ): Promise<{data: StayOffDay[]; count: number}> {
    const [{count}, data] = await Promise.all([
      this.stayOffDayRepository.count(filter?.where),
      this.stayOffDayRepository.find(filter),
    ]);

    return {count, data};
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @get('/stay-off-days/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'StayOffDay model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(StayOffDay),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(StayOffDay, {exclude: 'where'})
    filter?: FilterExcludingWhere<StayOffDay>,
  ): Promise<StayOffDay> {
    return this.stayOffDayRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @patch('/stay-off-days/{id}', {
    security: OPERATION_SECURITY_SPEC,

    responses: {
      '204': {
        description: 'StayOffDay PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(StayOffDay),
        },
      },
    })
    stayOffDay: StayOffDay,
  ): Promise<void> {
    await this.stayOffDayRepository.updateById(id, stayOffDay);
  }

  // @put('/stay-off-days/{id}', {
  //   responses: {
  //     '204': {
  //       description: 'StayOffDay PUT success',
  //     },
  //   },
  // })
  // async replaceById(
  //   @param.path.number('id') id: number,
  //   @requestBody() stayOffDay: StayOffDay,
  // ): Promise<void> {
  //   await this.stayOffDayRepository.replaceById(id, stayOffDay);
  // }

  @authenticate('jwt')
  @authorize(AUTHORIZE_CUSTOMER)
  @del('/stay-off-days/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'StayOffDay DELETE success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<{success: boolean}> {
    const current = await this.stayOffDayRepository.findById(id);
    await this.stayOffDayRepository.deleteById(id);
    await this.handleUpdateDayOffStay(current.serviceId);
    return {
      success: true,
    };
  }

  async handleUpdateDayOffStay(serviceId: number): Promise<void> {
    const now = dayjs().utc().toISOString();
    const stayDayOff = await this.stayOffDayRepository.find({
      where: {
        serviceId,
        date: {
          gte: now,
        },
      },
    });
    await this.stayRepository.elasticService.updateById(
      {
        dayOffs: stayDayOff.map((item) => {
          return {
            startDate: dayjs(item.date).startOf('d'),
            endDate: dayjs(item.date).endOf('d'),
          };
        }),
      },
      serviceId,
    );
  }
}
