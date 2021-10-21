import {inject, lifeCycleObserver, LifeCycleObserver, ValueOrPromise} from '@loopback/core';
import {juggler} from '@loopback/repository';
import config from './postgresql.datasource.config.json';

const postgreConfig = process.env.POSTGRESQL_HOST
  ? {
      name: 'postgresql',
      connector: 'postgresql',
      url: process.env.POSTGRESQL_HOST
        ? `postgres://${process.env.POSTGRESQL_DBUSER || 'uto_tech'}:${process.env.POSTGRESQL_DBPASS || 'dbpass123'}@${
            process.env.POSTGRESQL_HOST
          }:5432/${process.env.POSTGRESQL_DBNAME || 'uto_tech'}`
        : 'postgres://uto_tech:dbpass123@localhost:5432/uto_tech',
      host: process.env.POSTGRESQL_HOST || 'localhost',
      port: process.env.POSTGRESQL_PORT || 5432,
      user: process.env.POSTGRESQL_DBUSER || 'uto_tech',
      password: process.env.POSTGRESQL_DBPASS || 'dbpass123',
      database: process.env.POSTGRESQL_DBNAME || 'uto_tech',
      min: process.env.POSTGRESQL_CONNECTION_MIN || 1,
      max: process.env.POSTGRESQL_CONNECTION_MAX || 5,
      idleTimeoutMillis: process.env.POSTGRESQL_CONNECTION_IDLE_TIMEOUT || 100000
    }
  : config;

@lifeCycleObserver('datasource')
export class PostgresqlDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'postgresql';

  constructor(
    @inject('datasources.config.postgresql', {optional: true})
    dsConfig: object = postgreConfig,
  ) {
    super(dsConfig);
  }

  /**
   * Start the datasource when application is started
   */
  start(): ValueOrPromise<void> {
    // Add your logic here to be invoked when the application is started
  }

  /**
   * Disconnect the datasource when application is stopped. This allows the
   * application to be shut down gracefully.
   */
  stop(): ValueOrPromise<void> {
    return super.disconnect();
  }
}
