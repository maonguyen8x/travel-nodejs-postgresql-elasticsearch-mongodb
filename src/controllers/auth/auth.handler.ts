import {repository} from '@loopback/repository';
import {UsersRepository, PageRepository} from '../../repositories';
import {handleError} from '../../utils/handleError';
import {UserProfile, securityId} from '@loopback/security';
import {UserServiceBindings, TokenServiceBindings} from '../../keys';
import {inject} from '@loopback/core';
import {UserService, TokenService} from '@loopback/authentication';
import {Users} from '../../models';
import {userInfoQuery} from '../specs/user-controller.specs';
import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '../../constants/error.constant';

export class AuthHandler {
  constructor(
    @repository(UsersRepository) public usersRepository: UsersRepository,
    @repository(PageRepository) public pageRepository: PageRepository,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<Users, Credential>,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public jwtService: TokenService,
  ) {}

  async pageGenerateToken(pageId: number, currentUser: UserProfile): Promise<{token: string; current_user: Users}> {
    try {
      const page = await this.pageRepository.findById(pageId, {
        include: [
          {
            relation: 'relatedUser',
          },
        ],
      });

      if (parseInt(currentUser[securityId]) !== page.userId) {
        throw new HttpErrors.Forbidden(ErrorCode.PERMISSION_DENIED);
      }

      const targetUser = page.relatedUser;
      const userProfile = this.userService.convertToUserProfile(targetUser);
      const userId = parseInt(userProfile[securityId]);
      // create a JSON Web Token based on the user profile
      const token = await this.jwtService.generateToken(userProfile);
      const user = await this.usersRepository.findById(userId, {
        ...userInfoQuery(false),
      });

      return {
        token: token,
        current_user: user,
      };
    } catch (error) {
      return handleError(error);
    }
  }
}
