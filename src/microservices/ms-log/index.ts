import Parse from 'parse/node';

Parse.initialize(
  process.env.PARSE_LOG_APPPLICATION_ID || 'oulzlZnBPSZQOsXkMq8r',
  process.env.PARSE_LOG_JAVASCRIPT_KEY || 'csrCOWD0yaAatvfDQ2m4',
);
//javascriptKey is required only if you have it on server.

Parse.serverURL = process.env.PARSE_LOG_SERVER_URL || 'http://125.212.238.251:5000/parse';

export interface ILogPayload {
  service: string;
  type: 'info' | 'error';
  message?: string;
  path: string;
  metadata?: string;
  method?: string;
  body?: object;
  authorization?: string;
  user_agent?: string[];
}

export enum TypeLogs {
  INFO = 'info',
  ERROR = 'error',
}

export class Logs extends Parse.Object {
  constructor() {
    // Pass the ClassName to the Parse.Object constructor
    super('Logs');
  }

  public async create(payload: ILogPayload): Promise<Logs> {
    const log = new Logs();

    return log.save(payload);
  }
}
// After specifying the Monster subclass...
Parse.Object.registerSubclass('Logs', Logs);
