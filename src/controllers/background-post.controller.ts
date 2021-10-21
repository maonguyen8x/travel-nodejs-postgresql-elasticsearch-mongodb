import {Filter, repository} from '@loopback/repository';
import {param, get, getModelSchemaRef} from '@loopback/rest';
import {BackgroundPost, BackgroundPostWithColor} from '../models';
import {BackgroundPostRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {AUTHORIZE_RULE} from '../constants/authorize.constant';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {inject} from '@loopback/context';
import {SecurityBindings, UserProfile} from '@loopback/security';

export class BackgroundPostController {
  constructor(
    @repository(BackgroundPostRepository)
    public backgroundPostRepository: BackgroundPostRepository,
  ) {}

  @authenticate('jwt')
  @authorize(AUTHORIZE_RULE)
  @get('/background-posts', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of BackgroundPost model instances',
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
                  items: getModelSchemaRef(BackgroundPostWithColor),
                },
              },
            },
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) userProfile: UserProfile,
    @param.filter(BackgroundPost, {name: 'filterBackgroundPost'})
    filter?: Filter<BackgroundPost>,
  ): Promise<{
    count: number;
    data: BackgroundPostWithColor[];
  }> {
    const [result, count] = await Promise.all([
      this.backgroundPostRepository.find(filter),
      this.backgroundPostRepository.count(filter?.where),
    ]);

    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      data: result.map((background) => {
        return {
          ...background.backgroundPost,
          color: background.color,
        };
      }),
      count: count.count,
    };
  }
}
