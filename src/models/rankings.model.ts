import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import moment from 'moment';
import {Likes} from './likes.model';
import {Locations} from './locations.model';
import {Posts} from './posts.model';
import {ReplyRanking} from './reply-ranking.model';
import {Users} from './users.model';
import {RANKING_ACCESS_TYPE_ACCEPTED, RANKING_ACCESS_TYPES, RANKING_TYPES} from '../configs/ranking-constant';

@model()
export class Rankings extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  point?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalLike?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalReply?: number;

  @property({
    type: 'string',
  })
  review?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: RANKING_TYPES,
    },
  })
  rankingType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: RANKING_ACCESS_TYPES,
      default: RANKING_ACCESS_TYPE_ACCEPTED,
    },
  })
  rankingAccessType?: string;

  @property({
    type: 'number',
  })
  pageId?: number;
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

  @belongsTo(() => Users)
  userId: number;

  @belongsTo(() => Locations)
  locationId: number;

  @belongsTo(() => Posts)
  postId: number;

  @hasMany(() => Likes, {keyTo: 'rankingId'})
  likes: Likes[];

  @hasMany(() => ReplyRanking, {keyTo: 'rankingId'})
  replyRankings: ReplyRanking[];

  constructor(data?: Partial<Rankings>) {
    super(data);
  }
}

export interface RankingsRelations {
  // describe navigational properties here
}

export type RankingsWithRelations = Rankings & RankingsRelations;
