import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const host = process.env.MONGO_HOST || '125.212.238.251';
const databaseName = process.env.MONGO_DBNAME || 'dev';
const username = process.env.MONGO_USERNAME || 'uto_username_prod';
const password = process.env.MONGO_PASS || 'uto_password_prod_rwwUm56Xk6rZbnDe';
const port = process.env.MONGO_PORT || '27017';

const config = {
  name: 'mongodb',
  connector: 'mongodb',
  url: `mongodb://${username}:${password}@${host}:${port}/${databaseName}`,
  host: host,
  port: 27017,
  user: username,
  password: password,
  database: databaseName,
  useNewUrlParser: true,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongodbDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'mongodb';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongodb', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
