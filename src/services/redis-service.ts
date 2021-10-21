import {bind, BindingScope} from '@loopback/core';
import redis, {RedisClient} from 'redis';
// eslint-disable-next-line @typescript-eslint/class-name-casing
export interface redisService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): Promise<string>;
  set(key: string, value: string): void;
  setx(key: string, value: string, expireTime: number): void;
}

@bind({scope: BindingScope.TRANSIENT})
export class RedisService implements redisService {
  private client: RedisClient;

  constructor() {
    this.client = redis.createClient({
      port: 6379,
      host: process.env.REDIS_HOST || 'localhost',

      retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with
          // a individual error
          return new Error('Redis: The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands
          // with a individual error
          return new Error('Redis: Retry time exhausted');
        }
        if (options.attempt > 10) {
          // End reconnecting with built in error
          return new Error('Redis: End reconnecting');
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
      },
    });
    this.client.on('connect', () => {
      console.info('redis connected');
    });

    this.client.on('reconnecting', (info) => {
      if (info.attempt === 1) {
        console.info('redis lost connection');
      }
    });

    this.client.on('warning', (msg) => {
      console.warn('redis ' + msg);
    });

    this.client.on('error', (error) => {
      console.error('MAX_NUMBER_OF_CLIENTS_REACHED', error);

      if (error.message.indexOf('max number of clients reached') !== -1) {
        console.warn('redis connection closed');
        this.client.end(true); // stop the retry strategy
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (error, reply) => {
        if (error) {
          reject(error);
        } else {
          resolve(reply);
        }
      });
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: string): any {
    this.client.set(key, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setx(key: string, value: string, expireTime: number): void {
    this.client.set(key, value);
    this.client.expire(key, expireTime);
  }
}
