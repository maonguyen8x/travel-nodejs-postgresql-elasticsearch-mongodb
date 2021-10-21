import {inject} from '@loopback/context';
import {Filter} from '@loopback/repository';
import {get, param, getModelSchemaRef} from '@loopback/rest';

import {HandlerBindingKeys} from '../../constants/handlerBindingKeys';
import {OPERATION_SECURITY_SPEC} from '../../utils/security-spec';
import {StaticPageHandler} from './static-page.handler';
import {StaticPage} from '../../models';
import {handleError} from '../../utils/handleError';

export class StaticPageController {
  constructor(
    @inject(HandlerBindingKeys.STATIC_PAGE_HANDLER)
    public staticPageHandler: StaticPageHandler,
  ) {}

  // Map to GET /static-page
  @get('/static-page', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Admin create page',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                },
                data: {
                  type: 'array',
                  items: getModelSchemaRef(StaticPage),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(StaticPage, {name: 'filterStaticPage'})
    filter?: Filter<StaticPage>,
  ): Promise<{count: number; data: StaticPage[]}> {
    return this.staticPageHandler.find(filter).catch((error) => handleError(error));
  }

  // Map to GET /static-page/{id}
  @get('/static-page/alias/{alias}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Admin create page',
        content: {
          'application/json': {
            schema: getModelSchemaRef(StaticPage),
          },
        },
      },
    },
  })
  async findByAlias(@param.path.string('alias') alias: string): Promise<StaticPage> {
    return this.staticPageHandler.findByAlisa(alias).catch((error) => handleError(error));
  }
}
