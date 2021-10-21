import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {AnyObject, Filter, FilterExcludingWhere} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, post, put, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Avatars, Locations, MediaContents, Plan, Profiles, Task, Users} from '../../models';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {AUTHORIZE_RULE} from '../../constants/authorize.constant';
import {authorize} from '@loopback/authorization';
import {PlanLogicController} from '..';
import {handleError} from '../../utils/handleError';

export const planInfoSchema = {
  type: 'object',
  properties: {
    ...getModelSchemaRef(Plan).definitions.Plan.properties,
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ...getModelSchemaRef(Task).definitions.Task.properties,
          target: {
            type: 'object',
            properties: {
              ...getModelSchemaRef(Locations).definitions.Locations.properties,
              mediaContents: {
                type: 'array',
                items: getModelSchemaRef(MediaContents),
              },
            },
          },
        },
      },
    },
    totalTask: {
      type: 'number',
    },
    totalCompleted: {
      type: 'number',
    },
  },
};

export const planInfoQuery = () => {
  return {
    include: [
      {
        relation: 'tasks',
        scope: {
          order: ['taskDate ASC', 'index ASC'],
          include: [
            {
              relation: 'location',
            },
          ],
        },
      },
    ],
  };
};

export class PlanController {
  constructor(
    @inject('controllers.PlanLogicController')
    public planLogicController: PlanLogicController,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/plans', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Plan model instance',
        content: {'application/json': {schema: getModelSchemaRef(Plan)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Plan, {
            title: 'NewPlan',
            exclude: ['id'],
          }),
        },
      },
    })
    plan: Omit<Plan, 'id'>,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
  ): Promise<Plan> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.create({plan, userId});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/plans/user/{targetUserId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Plan model instances',
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
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(Plan).definitions.Plan.properties,
                      tasks: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Task).definitions.Task.properties,
                            location: getModelSchemaRef(Locations),
                            mediaContents: {
                              type: 'array',
                              items: getModelSchemaRef(MediaContents),
                            },
                          },
                        },
                      },
                      totalTask: {
                        type: 'number',
                      },
                      totalCompleted: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('targetUserId') targetUserId: number,
    @param.filter(Plan, {name: 'filterPlan'}) filter?: Filter<Plan>,
  ): Promise<{
    count: number;
    data: AnyObject[];
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.find({userId, targetUserId, filter}).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/plans/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Plan model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...getModelSchemaRef(Plan).definitions.Plan.properties,
                user: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Users).definitions.Users.properties,
                    profiles: {
                      type: 'object',
                      properties: {
                        ...getModelSchemaRef(Profiles).definitions.Profiles.properties,
                        avatars: {
                          type: 'object',
                          properties: {
                            ...getModelSchemaRef(Avatars).definitions.Avatars.properties,
                            mediaContent: {
                              type: 'object',
                              properties: {
                                ...getModelSchemaRef(MediaContents).definitions.MediaContents.properties,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      ...getModelSchemaRef(Task).definitions.Task.properties,
                      location: {
                        type: 'object',
                        properties: {
                          ...getModelSchemaRef(Locations).definitions.Locations.properties,
                          serviceId: {
                            type: 'number',
                          },
                          pageId: {
                            type: 'number',
                          },
                        },
                      },
                      mediaContents: {
                        type: 'array',
                        items: getModelSchemaRef(MediaContents),
                      },
                    },
                  },
                },
                totalTask: {
                  type: 'number',
                },
                totalCompleted: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Plan, {exclude: 'where', name: 'filterPlanById'})
    filter?: FilterExcludingWhere<Plan>,
  ): Promise<AnyObject> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.findById({userId, id, filter}).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/plans/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Plan PUT success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ...planInfoSchema.properties,
              },
            },
          },
        },
      },
    },
  })
  async updateById(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            title: 'UpdatePlan',
            properties: {
              ...getModelSchemaRef(Plan, {
                title: 'updatePlan',
                exclude: ['id'],
              }).definitions['updatePlan'].properties,
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ...getModelSchemaRef(Task).definitions.Task.properties,
                  },
                },
              },
            },
          },
        },
      },
    })
    plan: Plan,
  ): Promise<AnyObject> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.updateById({userId, id, plan}).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @del('/plans/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Plan DELETE success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async deleteById(
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.deleteById({userId, id});
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/plans/{id}/add_task', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Add Task to Plan with id success',
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
  async addTask(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            title: 'PlanAddTask',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                taskType: {
                  type: 'string',
                },
                locationId: {
                  type: 'number',
                },
                index: {
                  type: 'number',
                },
                taskDate: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    })
    request: Task[],
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.addTask({userId, id, request}).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @post('/plans/{id}/remove_task', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Plan model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async removeTask(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTask',
            exclude: ['id', 'status', 'createdAt', 'updatedAt'],
          }),
        },
      },
    })
    task: {
      locationId: number;
      serviceId: number;
      taskType: string;
    },
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<{
    message: string;
  }> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.removeTask({task, id, userId}).catch((e) => handleError(e));
  }

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @put('/plans/{id}/update_task/{taskId}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Task model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task)}},
      },
    },
  })
  async updateTask(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            partial: true,
            title: 'updateTask',
          }),
        },
      },
    })
    task: Task,
    @inject(SecurityBindings.USER)
    userProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.path.number('taskId') taskId: number,
  ): Promise<Task> {
    const userId = parseInt(userProfile[securityId]);
    return this.planLogicController.updateTask({taskId, task, userId, id}).catch((e) => handleError(e));
  }
}
