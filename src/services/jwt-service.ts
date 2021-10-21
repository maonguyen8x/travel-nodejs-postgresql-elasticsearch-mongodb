import {TokenService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {promisify} from 'util';
import {TokenServiceBindings} from '../keys';
import {UsersRepository} from '../repositories';
import {ErrorCode} from '../constants/error.constant';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private jwtExpiresIn: string,
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(ErrorCode.TOKEN_IS_NULL);
    }

    let userProfile: UserProfile;

    try {
      // decode user profile from token
      const decodedToken = await verifyAsync(token, this.jwtSecret);
      // don't copy over  token field 'iat' and 'exp', nor 'email' to user profile
      userProfile = Object.assign(
        {[securityId]: '', name: ''},
        {
          [securityId]: decodedToken.id,
          name: decodedToken.name,
          id: decodedToken.id,
          roles: decodedToken.roles,
          email: decodedToken.email,
        },
      );

      const targetUser = await this.usersRepository.findById(parseInt(userProfile[securityId]), {
        include: [
          {
            relation: 'email',
          },
        ],
      });
      if (targetUser?.email?.email !== userProfile.email) {
        throw new HttpErrors.Unauthorized(ErrorCode.ERROR_VERIFY_TOKEN);
      }
    } catch (error) {
      throw new HttpErrors.Unauthorized(ErrorCode.ERROR_VERIFY_TOKEN);
    }
    return userProfile;
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(ErrorCode.USERPROFILE_IS_NULL);
    }
    const userInfoForToken = {
      id: userProfile[securityId],
      name: userProfile.name,
      roles: userProfile.roles,
      email: userProfile.email,
    };
    // Generate a JSON Web Token
    let token: string;
    try {
      token = await signAsync(userInfoForToken, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
