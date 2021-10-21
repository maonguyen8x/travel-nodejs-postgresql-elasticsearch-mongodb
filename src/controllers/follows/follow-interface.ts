export interface FilterFollowersInterface {
  q: string;
  offset: number;
  limit: number;
  skip: number;
  where: object;
  order: string[];
}
