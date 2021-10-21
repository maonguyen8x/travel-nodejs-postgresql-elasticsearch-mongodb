import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {Count, CountSchema, repository, Where} from '@loopback/repository';
import {get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Report} from '../models';
import {ReportRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {reportStatus} from '../configs/utils-constant';
import {NotificationLogicController} from './notification/notification-logic.controller';

export class ReportController {
  constructor(
    @repository(ReportRepository)
    public reportRepository: ReportRepository,
    @inject('controllers.NotificationLogicController')
    public notificationLogicController: NotificationLogicController,
  ) {}

  @authenticate('jwt')
  @post('/reports', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Report model instance',
        content: {'application/json': {schema: getModelSchemaRef(Report)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Report, {
            title: 'NewReport',
            exclude: ['id', 'createdAt', 'updatedAt', 'userId', 'reportStatus', 'feedback'],
          }),
        },
      },
    })
    report: Omit<Report, 'id'>,
    @inject(SecurityBindings.USER) userProfile: UserProfile,
  ): Promise<Report> {
    const userId = parseInt(userProfile[securityId]);
    const result = await this.reportRepository.create({
      ...report,
      userId,
      reportStatus: reportStatus.WAITING_FOR_PROCESSING,
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationLogicController.notifyForAdmin({
      report: result,
    });

    return report;
  }

  @get('/reports/count', {
    responses: {
      '200': {
        description: 'Report model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Report) where?: Where<Report>): Promise<Count> {
    return this.reportRepository.count(where);
  }

  // @get('/reports/{id}', {
  //   responses: {
  //     '200': {
  //       description: 'Report model instance',
  //       content: {
  //         'application/json': {
  //           schema: getModelSchemaRef(Report, {includeRelations: true}),
  //         },
  //       },
  //     },
  //   },
  // })
  // async findById(
  //   @param.path.number('id') id: number,
  //   @param.filter(Report, {exclude: 'where'}) filter?: FilterExcludingWhere<Report>
  // ): Promise<Report> {
  //   return this.reportRepository.findById(id, filter);
  // }
  //
  // @patch('/reports/{id}', {
  //   responses: {
  //     '204': {
  //       description: 'Report PATCH success',
  //     },
  //   },
  // })
  // async updateById(
  //   @param.path.number('id') id: number,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Report, {partial: true}),
  //       },
  //     },
  //   })
  //   report: Report,
  // ): Promise<void> {
  //   await this.reportRepository.updateById(id, report);
  // }
  //
  // @put('/reports/{id}', {
  //   responses: {
  //     '204': {
  //       description: 'Report PUT success',
  //     },
  //   },
  // })
  // async replaceById(
  //   @param.path.number('id') id: number,
  //   @requestBody() report: Report,
  // ): Promise<void> {
  //   await this.reportRepository.replaceById(id, report);
  // }
}
