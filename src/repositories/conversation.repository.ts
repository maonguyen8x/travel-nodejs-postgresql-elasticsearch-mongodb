import {Getter, inject} from '@loopback/core';
import {
  AnyObject,
  DeepPartial,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {MongodbDataSource} from '../datasources';
import {Conversation, ConversationRelations, Message} from '../models';
import {MessageRepository} from './message.repository';
import {ElasticSearchServiceBindings} from '../keys';
import {ElasticSearchService} from '../services';

export class ConversationRepository extends DefaultCrudRepository<
  Conversation,
  typeof Conversation.prototype.id,
  ConversationRelations
> {
  public readonly messages: HasManyRepositoryFactory<Message, typeof Conversation.prototype.id>;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('MessageRepository')
    protected messageRepositoryGetter: Getter<MessageRepository>,
    //elasticsearch
    @inject(ElasticSearchServiceBindings.ELASTIC_SERVICE)
    public elasticService: ElasticSearchService,
  ) {
    super(Conversation, dataSource);
    this.messages = this.createHasManyRepositoryFactoryFor('messages', messageRepositoryGetter);
    this.registerInclusionResolver('messages', this.messages.inclusionResolver);
    this.elasticService.setIndex(String(Conversation.definition.name).toLowerCase());
  }

  create(
    entity: Partial<Conversation> | {[P in keyof Conversation]?: DeepPartial<Conversation[P]>} | Conversation,
    options?: AnyObject,
  ): Promise<Conversation> {
    return super.create(
      {
        ...entity,
        createdAt: entity.createdAt || moment().utc().toISOString(),
        updatedAt: entity.updatedAt || moment().utc().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof Conversation.prototype.id,
    data: Partial<Conversation> | {[P in keyof Conversation]?: DeepPartial<Conversation[P]>} | Conversation,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
      },
      options,
    );
  }
}
