import {Plan, Task, Locations} from '../../models';

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export interface PlanListResponseItemInterface extends Plan {
  totalTask?: number;
  tasks?: TaskWithTargetInterface[];
}

export interface TaskWithTargetInterface extends Task {
  target?: Locations;
}

export enum PlanAccessTypeEnum {
  private = 'PRIVATE',
  public = 'PUBLIC',
  follow = 'FOLLOW',
}

export enum PlanStatusEnum {
  draft = 'DRAFT',
  completed = 'COMPLETED',
}
