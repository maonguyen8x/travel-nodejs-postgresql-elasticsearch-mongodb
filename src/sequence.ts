import {
  AuthenticateFn,
  AuthenticationBindings,
  AUTHENTICATION_STRATEGY_NOT_FOUND,
  USER_PROFILE_NOT_FOUND,
  TokenService,
} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import logger from './utils/logger';
import {Logs, ILogPayload} from './microservices/ms-log';
import {isString} from 'lodash';
import {pushError, removeCredential} from './utils/handleError';
import {TokenServiceBindings} from './keys';
import {omit} from 'lodash';

import {promisify} from 'util';
const jwt = require('jsonwebtoken');
const verifyAsync = promisify(jwt.verify);

const SequenceActions = RestBindings.SequenceActions;

enum EnumEnviroment {
  production = 'production',
}

const requestHistories = async (context: RequestContext): Promise<void> => {
  const logData: ILogPayload = {
    method: context.request.method,
    service: process.env.SERVICE_NAME || 'service-api',
    path: context.request.url,
    body: context.request.body || {},
    authorization: context.request.headers['authorization'],
    user_agent: isString(context.request.headers['user_agent'])
      ? [context.request.headers['user_agent']]
      : context.request.headers['user_agent'],
    type: 'info',
  };
  logger.info(JSON.stringify(logData));
  const logService = new Logs();
  logService.create(logData);

  return;
};

export class MySequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private jwtSecret: string,
  ) {}

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      const route = this.findRoute(request);

      //call authentication action
      await this.authenticateRequest(request);

      // Authentication successful, proceed to invoke controller
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);

      // request histories
      if (process.env.NODE_ENV !== EnumEnviroment.production) requestHistories(context);

      this.send(response, result);
    } catch (err) {
      let token = context.request.headers['authorization'];
      token = token?.split(' ')[1];
      let decodedToken = token ? await verifyAsync(token, this.jwtSecret) : {};
      decodedToken = omit(decodedToken, ['email', 'iat', 'exp']);

      const logData: any = {
        method: context.request.method,
        service: process.env.SERVICE_NAME || 'APP-APIs',
        path: context.request.url,
        body: context.request.body
          ? JSON.stringify(removeCredential(context.request.body))
          : JSON.stringify(context.request.query)
          ? JSON.stringify(context.request.query)
          : 'empty request data',
        message: JSON.stringify(err.stack || err.message),
        metadata: JSON.stringify(err),
        //authorization: context.request.headers['authorization'],
        user_agent: isString(context.request.headers['user_agent'])
          ? [context.request.headers['user_agent']]
          : context.request.headers['user_agent'],
        actor: JSON.stringify(decodedToken),
        type: 'error',
      };
      logger.error(JSON.stringify(logData));
      const logService = new Logs();
      logService.create(logData);

      if (!(err.statusCode >= 400 && err.statusCode < 500)) {
        let slackStr = '';
        for (const field in logData) {
          slackStr += `\n${field}: ` + logData[field];
        }
        pushError(slackStr);
      }

      if (err.code === AUTHENTICATION_STRATEGY_NOT_FOUND || err.code === USER_PROFILE_NOT_FOUND) {
        Object.assign(err, {statusCode: 401 /* Unauthorized */});
      }
      this.reject(context, err);
    }
  }
}
