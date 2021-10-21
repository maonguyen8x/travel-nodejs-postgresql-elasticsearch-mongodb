import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {ChildComment} from './child-comment.model';
import {Comments} from './comments.model';
import {Posts} from './posts.model';
import {Rankings} from './rankings.model';
import {ReplyRanking} from './reply-ranking.model';
import {Users} from './users.model';

@model()
export class Likes extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

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

  @belongsTo(() => Posts)
  postId: number;

  @belongsTo(() => Comments)
  commentId: number;

  @belongsTo(() => ChildComment)
  childCommentId: number;

  @belongsTo(() => Rankings)
  rankingId: number;

  @belongsTo(() => ReplyRanking)
  replyRankingId: number;

  constructor(data?: Partial<Likes>) {
    super(data);
  }
}

export interface LikesRelations {
  // describe navigational properties here
}

export type LikesWithRelations = Likes & LikesRelations;
