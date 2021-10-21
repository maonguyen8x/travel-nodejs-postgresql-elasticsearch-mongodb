// Uncomment these imports to begin using these cool features!

import {AnyObject, Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {
  LocationsRepository,
  MaterializedViewLocationsRepository,
  PageRepository,
  PlanRepository,
  PostsRepository,
  ServiceRepository,
  StayRepository,
  TaskRepository,
  TourRepository,
  UsersRepository,
} from '../../repositories';
import {planInfoQuery, UserLogicController} from '..';
import {HttpErrors} from '@loopback/rest';
import {Plan, Task, TaskWithRelations, MediaContents, MetadataPost} from '../../models';
import moment from 'moment';
import {handleError} from '../../utils/handleError';
import {TASK_STATUS_COMPLETED} from '../../configs/plan-constant';
import {LocationTypesEnum} from '../../configs/location-constant';
import {PlanResponse, TaskResponse} from './plan.interface';
import {asyncLimiter} from '../../utils/Async-limiter';
import omit from 'lodash/omit';
import {ErrorCode} from '../../constants/error.constant';
import * as Joi from 'joi';
import {PlanAccessTypeEnum, PlanStatusEnum} from './plan.constant';
import {inject} from '@loopback/context';
import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {UsersBlockHandler} from '../user-block/users-block.handler';
import {POST_TYPE_SHARE_PLAN} from '../../configs/post-constants';

export class PlanLogicController {
  constructor(
    @repository(PlanRepository)
    public planRepository: PlanRepository,
    @repository(TaskRepository)
    public taskRepository: TaskRepository,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
    @repository(LocationsRepository)
    public locationsRepository: LocationsRepository,
    @repository(PageRepository)
    public pageRepository: PageRepository,
    @repository(TourRepository)
    public tourRepository: TourRepository,
    @repository(ServiceRepository)
    public serviceRepository: ServiceRepository,
    @repository(StayRepository)
    public stayRepository: StayRepository,
    @repository(PostsRepository)
    public postsRepository: PostsRepository,
    @repository(MaterializedViewLocationsRepository)
    public materializedViewLocationsRepository: MaterializedViewLocationsRepository,
    @inject(HandlerBindingKeys.USERS_BLOCK_HANDLER)
    public usersBlockHandler: UsersBlockHandler,
    @inject('controllers.UserLogicController')
    private userLogicController: UserLogicController,
  ) {}

  async create({plan, userId}: {plan: Omit<Plan, 'id'>; userId: number}): Promise<Plan> {
    this.validateCreatePlan(plan);
    return this.planRepository.create({
      ...plan,
      userId: userId,
      createdAt: moment().utc().toISOString(),
      updatedAt: moment().utc().toISOString(),
    });
  }

  validateCreatePlan(payload: Plan) {
    const schema = Joi.object({
      planName: Joi.string().trim().max(50).required(),
      startDate: Joi.date().min(new Date().setHours(0, 0, 0, 0)).iso().required(),
      endDate: Joi.date().min(Joi.ref('startDate')).iso().required(),
      accessType: Joi.string(),
      note: Joi.string().allow('').max(250),
      status: Joi.string(),
    });
    const {error} = schema.validate(payload);
    if (error) {
      throw new HttpErrors.BadRequest(error.message);
    } else {
      return true;
    }
  }

  async find({
    userId,
    targetUserId,
    filter,
  }: {
    userId: number;
    targetUserId: number;
    filter?: Filter<Plan>;
  }): Promise<{
    count: number;
    data: PlanResponse[];
  }> {
    try {
      const isGuest = userId !== targetUserId;
      let filterGuest = {};
      if (isGuest) {
        const userBlockIds = await this.usersBlockHandler.getListUserBlockIds(targetUserId);
        const isBlocked = !!userBlockIds.find((item) => item === userId);
        if (isBlocked) {
          return {
            count: 0,
            data: [],
          };
        }
        const userFollow = await this.userLogicController.listUserFollowing(userId);
        const followIds = userFollow.map((item) => item.followingId);
        const isFollowing = !!followIds.find((item) => item === targetUserId);
        filterGuest = {
          status: PlanStatusEnum.completed,
          accessType: {
            inq: isFollowing ? [PlanAccessTypeEnum.public, PlanAccessTypeEnum.follow] : [PlanAccessTypeEnum.public],
          },
        };
      }
      const filterPlan = {
        ...filter,
        where: {
          ...filter?.where,
          userId: targetUserId,
          ...filterGuest,
        },
      };
      const [plans, count] = await Promise.all([
        this.planRepository.find(filterPlan),
        this.planRepository.count(filterPlan?.where),
      ]);
      const data = await Promise.all(plans.map((plan) => this.findById({id: plan.id || 0, userId})));
      return {
        count: count.count,
        data: data,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async findById({id}: {userId: number; id: number; filter?: FilterExcludingWhere<Plan>}): Promise<PlanResponse> {
    try {
      const result = await this.planRepository.findById(id, {
        include: [
          {
            relation: 'user',
            scope: {
              include: [
                {
                  relation: 'profiles',
                  scope: {
                    include: [
                      {
                        relation: 'avatars',
                        scope: {
                          include: [
                            {
                              relation: 'mediaContent',
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
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
      });

      const tasks = result.tasks || [];
      const locationIds = tasks.map((task) => task.locationId);
      const mateLocations = await this.materializedViewLocationsRepository.find({
        where: {
          id: {inq: locationIds},
        },
      });

      const getMediaContentsByTask = (task: Task): MediaContents[] => {
        const mateLocation = mateLocations.find((element) => element.id === task.locationId);
        const locationType = mateLocation?.locationType || LocationTypesEnum.where;
        const map = {
          [LocationTypesEnum.where.toString()]: mateLocation?.postMedias ? mateLocation.postMedias : [],
          [LocationTypesEnum.tour.toString()]: mateLocation?.tourMedias ? mateLocation.tourMedias : [],
          [LocationTypesEnum.food.toString()]: mateLocation?.backgroundMedia ? [mateLocation.backgroundMedia] : [],
          [LocationTypesEnum.stay.toString()]: mateLocation?.backgroundMedia ? [mateLocation.backgroundMedia] : [],
        };

        return map[locationType];
      };

      const getDetailLocationByTask = async (task: TaskWithRelations): Promise<TaskResponse | undefined> => {
        try {
          const {location} = task;
          if (location) {
            if ([LocationTypesEnum.tour.toString()].includes(location.locationType || '')) {
              const tour = await this.tourRepository.findOne({
                where: {
                  locationId: location.id,
                },
              });
              if (tour?.serviceId) {
                const service = await this.serviceRepository.findById(tour.serviceId);
                return {
                  ...task,
                  location: {
                    ...location,
                    pageId: service.pageId,
                    serviceId: tour?.serviceId,
                  },
                };
              }
            }
            if (
              [LocationTypesEnum.food.toString(), LocationTypesEnum.stay.toString()].includes(
                location.locationType || '',
              )
            ) {
              const page = await this.pageRepository.findOne({
                where: {
                  locationId: location.id,
                },
              });
              return {
                ...task,
                location: {
                  ...location,
                  pageId: page?.id,
                },
              };
            }
          }
          return {
            ...task,
          };
        } catch (e) {
          return {
            ...task,
          };
        }
      };

      const tasksIncludeMedias = await Promise.all(
        tasks.map(async (task: TaskWithRelations) => {
          const mediaContents = getMediaContentsByTask(task);
          const taskWithRelatedId = await getDetailLocationByTask(task);
          return {...taskWithRelatedId, mediaContents};
        }),
      );
      return {
        ...result,
        totalTask: tasks.length,
        totalCompleted: tasks.filter((item: Task) => item.status === TASK_STATUS_COMPLETED).length,
        tasks: tasksIncludeMedias,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async updateById({userId, id, plan}: {userId: number; id: number; plan: Plan}): Promise<AnyObject> {
    try {
      /**
       * check exists plan of user
       */
      const targetPlan = await this.planRepository.findOne({
        where: {
          userId: userId,
          id: id,
        },
      });
      if (!targetPlan) {
        throw new HttpErrors.NotFound(ErrorCode.PLANS_NOT_FOUND);
      }
      /**
       * update plan info
       */
      const planInfo = omit(plan, ['tasks']);
      await this.planRepository.updateById(id, planInfo);
      /**
       * update plan task
       */
      const {tasks} = plan;
      if (Array.isArray(tasks)) {
        const remainTaskIds = tasks.map((item) => item.id).filter((item) => item);
        const currentTasks = await this.taskRepository.find({
          where: {
            planId: id,
          },
        });
        // remove task
        await Promise.all(
          currentTasks.map((item) => {
            if (!remainTaskIds.includes(item.id)) {
              return this.taskRepository.deleteById(item.id);
            }
          }),
        );
        // add new task
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        await asyncLimiter(
          tasks.map(async (item, index: number) => {
            if (item) {
              if (item.id) {
                return this.taskRepository.updateById(item.id, {
                  ...omit(item, ['id']),
                  planId: id,
                  index,
                  taskDate: item.taskDate,
                });
              } else {
                return this.taskRepository.create({
                  ...omit(item, ['id']),
                  planId: id,
                  index,
                  taskDate: item.taskDate,
                });
              }
            }
          }),
        );
      }
      /**
       * query plan result
       */
      const result = await this.planRepository.findById(id, {
        ...planInfoQuery(),
      });
      return {
        ...result,
        totalTasks: result?.tasks?.length || 0,
        totalCompleted: result?.tasks?.filter((item) => item.status === TASK_STATUS_COMPLETED).length || 0,
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async deleteById({
    userId,
    id,
  }: {
    userId: number;
    id: number;
  }): Promise<{
    message: string;
  }> {
    const targetPlan = await this.planRepository.findOne({
      where: {
        userId: userId,
        id: id,
      },
    });
    if (!targetPlan) {
      throw new HttpErrors.NotFound(ErrorCode.PLANS_NOT_FOUND);
    }
    const listPostSharePlanId = await this.postsRepository.find({
      where: {
        planId: id,
        postType: POST_TYPE_SHARE_PLAN,
      },
    });
    listPostSharePlanId.forEach(async (item) => {
      const metadataItem: MetadataPost = item.metadata || {};
      delete metadataItem.plan;
      await this.postsRepository.updateById(item.id, {
        metadata: metadataItem,
        mediaContents: [],
        isPublicPlan: false,
      });
    });
    await this.taskRepository.deleteAll({
      planId: id,
    });
    await this.planRepository.deleteById(id);
    return {
      message: 'Delete plan successful',
    };
  }

  async addTask({request, userId, id}: {request: Task[]; userId: number; id: number}): Promise<void> {
    try {
      const targetPlan = await this.planRepository.findOne({
        where: {
          userId: userId,
          id: id,
        },
      });
      if (!targetPlan) {
        throw new HttpErrors.NotFound(ErrorCode.PLANS_NOT_FOUND);
      }
      await asyncLimiter(request.map((task) => this.planRepository.tasks(id).create({...task})));
    } catch (e) {
      return handleError(e);
    }
  }

  async removeTask({
    userId,
    id,
    task,
  }: {
    userId: number;
    id: number;
    task: {
      locationId: number;
      serviceId: number;
      taskType: string;
    };
  }): Promise<{
    message: string;
  }> {
    try {
      const targetPlan = await this.planRepository.findOne({
        where: {
          userId: userId,
          id: id,
        },
      });
      if (!targetPlan) {
        throw new HttpErrors.NotFound(ErrorCode.PLANS_NOT_FOUND);
      }
      await this.planRepository.tasks(id).delete(task);
      return {
        message: 'Remove task successful',
      };
    } catch (e) {
      return handleError(e);
    }
  }

  async updateTask({
    task,
    userId,
    id,
    taskId,
  }: {
    task: Task;
    userId: number;
    id: number;
    taskId: number;
  }): Promise<Task> {
    try {
      const targetPlan = await this.planRepository.findOne({
        where: {
          userId: userId,
          id: id,
        },
      });
      if (!targetPlan) {
        throw new HttpErrors.NotFound(ErrorCode.PLANS_NOT_FOUND);
      }
      await this.taskRepository.updateById(taskId, {
        ...task,
      });
      return await this.taskRepository.findById(taskId);
    } catch (e) {
      return handleError(e);
    }
  }
}
