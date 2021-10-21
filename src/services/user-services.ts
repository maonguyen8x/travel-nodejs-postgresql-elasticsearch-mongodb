import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {PasswordHasherBindings} from '../keys';
import {Users} from '../models';
import {Credentials, UserEmailRepository, UsersRepository} from '../repositories';
import {PasswordHasher} from './hash.password.bcryptjs';
import {ErrorCode} from '../constants/error.constant';

export class MyUserService implements UserService<Users, Credentials> {
  constructor(
    @repository(UsersRepository) public userRepository: UsersRepository,
    @repository(UserEmailRepository)
    public userEmailRepository: UserEmailRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<Users> {
    const email = await this.userEmailRepository.findOne({
      where: {email: credentials.email},
    });
    if (!email) {
      throw new HttpErrors.Unauthorized(ErrorCode.INVALID_EMAIL_OR_PASSWORD);
    }
    const foundUser = await this.userRepository.findById(email.userId, {
      include: [
        {
          relation: 'email',
        },
      ],
    });
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(ErrorCode.INVALID_EMAIL_OR_PASSWORD);
    }

    const credentialsFound = await this.userRepository.findCredentials(foundUser.id);
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(ErrorCode.INVALID_EMAIL_OR_PASSWORD);
    }

    const passwordMatched = await this.passwordHasher.comparePassword(credentials.password, credentialsFound.password);

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(ErrorCode.INVALID_EMAIL_OR_PASSWORD);
    }

    if (!foundUser.isActive) {
      throw new HttpErrors.Unauthorized(ErrorCode.UNVERIFICATION_EMAIL);
    }
    return foundUser;
  }

  convertToUserProfile(user: Users): UserProfile {
    const userId = String(user.id!);
    return {
      [securityId]: userId,
      name: String(user.name) || '',
      id: user.id,
      email: user.email?.email,
      roles: user.roles,
    };
  }
}
