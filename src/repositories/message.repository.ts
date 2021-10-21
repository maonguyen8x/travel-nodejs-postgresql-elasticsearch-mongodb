import {Getter, inject} from '@loopback/core';
import {AnyObject, BelongsToAccessor, DeepPartial, DefaultCrudRepository, repository} from '@loopback/repository';
import moment from 'moment';
import {MongodbDataSource} from '../datasources';
import {Conversation, Message, MessageRelations, Users} from '../models';
import {ConversationRepository} from './conversation.repository';
import {UsersRepository} from './users.repository';

export class MessageRepository extends DefaultCrudRepository<Message, typeof Message.prototype.id, MessageRelations> {
  public readonly conversation: BelongsToAccessor<Conversation, typeof Message.prototype.id>;

  public readonly user: BelongsToAccessor<Users, typeof Message.prototype.id>;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('ConversationRepository')
    protected conversationRepositoryGetter: Getter<ConversationRepository>,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
  ) {
    super(Message, dataSource);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.conversation = this.createBelongsToAccessorFor('conversation', conversationRepositoryGetter);
    this.registerInclusionResolver('conversation', this.conversation.inclusionResolver);
  }

  create(
    entity: Partial<Message> | {[P in keyof Message]?: DeepPartial<Message[P]>} | Message,
    options?: AnyObject,
  ): Promise<Message> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  updateById(
    id: typeof Message.prototype.id,
    data: Partial<Message> | {[P in keyof Message]?: DeepPartial<Message[P]>} | Message,
    options?: AnyObject,
  ): Promise<void> {
    return super.updateById(
      id,
      {
        ...data,
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
