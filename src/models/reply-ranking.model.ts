import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Likes} from './likes.model';
import {Rankings} from './rankings.model';
import {Users} from './users.model';
import moment from 'moment';

@model()
export class ReplyRanking extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  content?: string;

  @property({
    type: 'number',
    default: 0,
  })
  totalLike?: number;

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Rankings)
  rankingId: number;

  @hasMany(() => Likes)
  likes: Likes[];

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  createdAt?: string;

  @property({
    type: 'date',
    default: moment().utc().toISOString(),
  })
  updatedAt?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string;

  constructor(data?: Partial<ReplyRanking>) {
    super(data);
  }
}

export interface ReplyRankingRelations {
  // describe navigational properties here
}

export type ReplyRankingWithRelations = ReplyRanking & ReplyRankingRelations;
