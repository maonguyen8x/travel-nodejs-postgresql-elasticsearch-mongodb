import {belongsTo, Entity, model, property} from '@loopback/repository';
import moment from 'moment';
import {Locations} from './locations.model';
import {Posts} from './posts.model';
import {Rankings} from './rankings.model';
import {Users} from './users.model';
import {reportStatus, reportTypes} from '../configs/utils-constant';
import {ReasonType} from '@uto-tech/uto-types/dist/constants';
import {Page} from './page.model';
import {Activity} from './activity.model';

@model()
export class Report extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    maxLength: 250,
  })
  content?: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [
        ReasonType.POST_VIOLATE_COMMUNITY_RULES,
        ReasonType.POST_COPYRIGHT_INFRINGEMENT,
        ReasonType.POST_SPAM,
        ReasonType.POST_OTHER,
        ReasonType.USER_VIOLATE_COMMUNITY_RULES,
        ReasonType.USER_SPAM,
        ReasonType.USER_INFORMATION_FAKE,
        ReasonType.USER_FAKE_OTHER_USER,
        ReasonType.USER_OTHER,
        ReasonType.PAGE_VIOLATE_COMMUNITY_RULES,
        ReasonType.PAGE_INFORMATION_FAKE,
        ReasonType.PAGE_FAKE_OTHER_PAGE,
        ReasonType.PAGE_OTHER,
        ReasonType.LOCATION_DUPLICATE,
        ReasonType.LOCATION_INFORMATION_FAKE,
        ReasonType.LOCATION_SPAM,
        ReasonType.LOCATION_OTHER,
        ReasonType.RANKING_OTHER,
        ReasonType.ACTIVITY_VIOLATE_COMMUNITY_RULES,
        ReasonType.ACTIVITY_COPYRIGHT_INFRINGEMENT,
        ReasonType.ACTIVITY_SPAM,
        ReasonType.ACTIVITY_OTHER,
      ],
    },
    default: ReasonType.POST_OTHER,
  })
  reasonType?: string;

  @property({
    type: 'string',
  })
  feedback?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [
        reportTypes.REPORT_LOCATION,
        reportTypes.REPORT_POST,
        reportTypes.REPORT_RANKING,
        reportTypes.REPORT_USER,
        reportTypes.REPORT_PAGE,
        reportTypes.REPORT_REVIEW_PAGE,
        reportTypes.REPORT_ACTIVITY,
      ],
    },
  })
  reportType?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [
        reportStatus.WAITING_FOR_PROCESSING,
        reportStatus.CLOSED,
        reportStatus.COMPLETED,
        reportStatus.PENDING,
        reportStatus.PROCESSING,
      ],
    },
  })
  reportStatus?: string;

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

  @belongsTo(() => Users)
  targetUserId: number;

  @belongsTo(() => Posts)
  targetPostId: number;

  @belongsTo(() => Rankings)
  targetRankingId: number;

  @belongsTo(() => Locations)
  targetLocationId: number;

  @belongsTo(() => Page)
  targetPageId: number;

  @belongsTo(() => Activity)
  targetActivityId: number;

  constructor(data?: Partial<Report>) {
    super(data);
  }
}

export interface ReportRelations {
  // describe navigational properties here
}

export type ReportWithRelations = Report & ReportRelations;
