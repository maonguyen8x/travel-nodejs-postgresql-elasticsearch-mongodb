import {PlanWithRelations, TaskWithRelations, MediaContents, LocationsWithRelations} from '../../models';

export interface TaskResponse extends Partial<TaskWithRelations> {
  location?: LocationWithServiceIdInterface;
  mediaContents?: MediaContents[];
}

export interface PlanResponse extends Partial<Omit<PlanWithRelations, 'tasks'>> {
  totalTask: number;
  totalCompleted: number;
  tasks: TaskResponse[];
}

export interface LocationWithServiceIdInterface extends Partial<LocationsWithRelations> {
  serviceId?: number;
  pageId?: number;
}
