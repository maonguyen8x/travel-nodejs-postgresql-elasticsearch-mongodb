export const locationTypes = ['WHERE', 'FOOD', 'STAY', 'TOUR', 'OTHER', 'ACTIVITY', 'GOOGLE'];
export const locationStatus = ['REQUESTED', 'ACCEPTED', 'REJECTED'];

export enum LocationTypesEnum {
  where = 'WHERE',
  food = 'FOOD',
  stay = 'STAY',
  tour = 'TOUR',
  other = 'OTHER',
  activity = 'ACTIVITY',
  google = 'GOOGLE',
}

export enum LocationStatusEnum {
  draft = 'DRAFT',
  public = 'PUBLIC',
}

export enum LocationIsFullEnum {
  full = 'FULL',
  normal = 'NORMAL',
}
