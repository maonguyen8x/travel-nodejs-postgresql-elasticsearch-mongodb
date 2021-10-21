import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Page} from './page.model';
import {MediaContents} from './media-contents.model';
import {EnumIdentityType, VerifyPageStatus} from '../controllers/pages/page.constant';

@model()
export class PageVerification extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [VerifyPageStatus.REQUESTED, VerifyPageStatus.COMPLETED, VerifyPageStatus.REJECT],
    },
    default: VerifyPageStatus.REQUESTED,
  })
  status: string;

  @property({
    type: 'array',
    itemType: 'number',
  })
  personalMediaIds: number[];

  @property({
    type: 'array',
    itemType: 'number',
  })
  enterpriseMediaIds?: number[];

  @property({
    type: 'string',
  })
  identityCode: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: [EnumIdentityType.IDENTITY_CARD, EnumIdentityType.PASSPORT, EnumIdentityType.LICENSE],
    },
    default: EnumIdentityType.IDENTITY_CARD,
  })
  identityType: string;

  @property({
    type: 'string',
    required: true,
  })
  fullName: string;

  @property({
    type: 'string',
  })
  nationality: string;

  @property({
    type: 'string',
  })
  reason?: string;

  @property({
    type: 'string',
  })
  enterpriseName?: string;

  @belongsTo(() => Page)
  pageId: number;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @property({
    type: 'date',
  })
  deletedAt?: string;

  constructor(data?: Partial<PageVerification>) {
    super(data);
  }
}

export interface PageVerificationRelations {
  // describe navigational properties here
  personalMediaContents: MediaContents[];
  enterpriseMediaContents: MediaContents[];
  page: Page;
}

export type PageVerificationWithRelations = PageVerification & PageVerificationRelations;
