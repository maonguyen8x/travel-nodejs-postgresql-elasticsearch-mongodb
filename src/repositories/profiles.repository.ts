import {Getter, inject} from '@loopback/core';
import {
  AnyObject,
  BelongsToAccessor,
  DeepPartial,
  DefaultCrudRepository,
  HasOneRepositoryFactory,
  repository,
} from '@loopback/repository';
import moment from 'moment';
import {PostgresqlDataSource} from '../datasources';
import {
  Avatars,
  Backgrounds,
  Profiles,
  ProfilesRelations,
  UserAddress,
  UserBirthday,
  UserGender,
  UserIntroduce,
  UserPhone,
  Users,
  UserWebsite,
  UserWork,
} from '../models';
import {AvatarsRepository} from './avatars.repository';
import {BackgroundsRepository} from './backgrounds.repository';
import {UserAddressRepository} from './user-address.repository';
import {UserBirthdayRepository} from './user-birthday.repository';
import {UserGenderRepository} from './user-gender.repository';
import {UserIntroduceRepository} from './user-introduce.repository';
import {UserPhoneRepository} from './user-phone.repository';
import {UserWebsiteRepository} from './user-website.repository';
import {UserWorkRepository} from './user-work.repository';
import {UsersRepository} from './users.repository';
import {
  SYSTEM_DEFAULT_AVATARS,
  SYSTEM_MEDIA_CONTENT_DEFAULT_BACKGROUND_USER_ID,
  SystemDefaultAvatarMediaTypeEnum,
} from '../configs/media-contents-constants';
import {USER_GENDER_UNSPECIFIED, USER_PROFILE_BIO_DEFAULT} from '../configs/user-constants';
import omit from 'lodash/omit';
import {MediaContentsRepository} from '.';

export class ProfilesRepository extends DefaultCrudRepository<
  Profiles,
  typeof Profiles.prototype.id,
  ProfilesRelations
> {
  public readonly user: BelongsToAccessor<Users, typeof Profiles.prototype.id>;

  public readonly avatars: HasOneRepositoryFactory<Avatars, typeof Profiles.prototype.id>;

  public readonly backgrounds: HasOneRepositoryFactory<Backgrounds, typeof Profiles.prototype.id>;

  public readonly birthday: HasOneRepositoryFactory<UserBirthday, typeof Profiles.prototype.id>;

  public readonly gender: HasOneRepositoryFactory<UserGender, typeof Profiles.prototype.id>;

  public readonly address: HasOneRepositoryFactory<UserAddress, typeof Profiles.prototype.id>;

  public readonly introduce: HasOneRepositoryFactory<UserIntroduce, typeof Profiles.prototype.id>;

  public readonly work: HasOneRepositoryFactory<UserWork, typeof Profiles.prototype.id>;

  public readonly website: HasOneRepositoryFactory<UserWebsite, typeof Profiles.prototype.id>;

  public readonly phone: HasOneRepositoryFactory<UserPhone, typeof Profiles.prototype.id>;

  constructor(
    @inject('datasources.postgresql')
    dataSource: PostgresqlDataSource,
    @repository.getter('UsersRepository')
    protected usersRepositoryGetter: Getter<UsersRepository>,
    @repository.getter('AvatarsRepository')
    protected avatarsRepositoryGetter: Getter<AvatarsRepository>,
    @repository.getter('BackgroundsRepository')
    protected backgroundsRepositoryGetter: Getter<BackgroundsRepository>,
    @repository.getter('UserBirthdayRepository')
    protected userBirthdayRepositoryGetter: Getter<UserBirthdayRepository>,
    @repository.getter('UserGenderRepository')
    protected userGenderRepositoryGetter: Getter<UserGenderRepository>,
    @repository.getter('UserAddressRepository')
    protected userAddressRepositoryGetter: Getter<UserAddressRepository>,
    @repository.getter('UserIntroduceRepository')
    protected userIntroduceRepositoryGetter: Getter<UserIntroduceRepository>,
    @repository.getter('UserWorkRepository')
    protected userWorkRepositoryGetter: Getter<UserWorkRepository>,
    @repository.getter('UserWebsiteRepository')
    protected userWebsiteRepositoryGetter: Getter<UserWebsiteRepository>,
    @repository.getter('UserPhoneRepository')
    protected userPhoneRepositoryGetter: Getter<UserPhoneRepository>,
    @repository(MediaContentsRepository)
    protected mediaContentsRepository: MediaContentsRepository,
  ) {
    super(Profiles, dataSource);
    this.phone = this.createHasOneRepositoryFactoryFor('phone', userPhoneRepositoryGetter);
    this.registerInclusionResolver('phone', this.phone.inclusionResolver);
    this.website = this.createHasOneRepositoryFactoryFor('website', userWebsiteRepositoryGetter);
    this.registerInclusionResolver('website', this.website.inclusionResolver);
    this.work = this.createHasOneRepositoryFactoryFor('work', userWorkRepositoryGetter);
    this.registerInclusionResolver('work', this.work.inclusionResolver);
    this.introduce = this.createHasOneRepositoryFactoryFor('introduce', userIntroduceRepositoryGetter);
    this.registerInclusionResolver('introduce', this.introduce.inclusionResolver);
    this.address = this.createHasOneRepositoryFactoryFor('address', userAddressRepositoryGetter);
    this.registerInclusionResolver('address', this.address.inclusionResolver);
    this.gender = this.createHasOneRepositoryFactoryFor('gender', userGenderRepositoryGetter);
    this.registerInclusionResolver('gender', this.gender.inclusionResolver);
    this.birthday = this.createHasOneRepositoryFactoryFor('birthday', userBirthdayRepositoryGetter);
    this.registerInclusionResolver('birthday', this.birthday.inclusionResolver);
    this.backgrounds = this.createHasOneRepositoryFactoryFor('backgrounds', backgroundsRepositoryGetter);
    this.registerInclusionResolver('backgrounds', this.backgrounds.inclusionResolver);
    this.avatars = this.createHasOneRepositoryFactoryFor('avatars', avatarsRepositoryGetter);
    this.registerInclusionResolver('avatars', this.avatars.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', usersRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  async create(
    entity: Partial<Profiles> | {[P in keyof Profiles]?: DeepPartial<Profiles[P]>} | Profiles,
    options?: AnyObject,
  ): Promise<Profiles> {
    const data = {
      ...entity,
    };
    delete entity.avatars;
    delete entity.backgrounds;
    delete entity.birthday;
    delete entity.gender;
    delete entity.phone;
    const profile = await super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
    const defaultAvatar = await this.mediaContentsRepository.findOne({
      where: {
        mediaType: SYSTEM_DEFAULT_AVATARS(data.gender?.gender || USER_GENDER_UNSPECIFIED),
      },
    });
    await this.avatars(profile.id).create({
      mediaContentId: defaultAvatar?.id,
      ...data?.avatars,
    });
    await this.backgrounds(profile.id).create({
      mediaContentId: SYSTEM_MEDIA_CONTENT_DEFAULT_BACKGROUND_USER_ID,
      ...data?.backgrounds,
    });
    await this.birthday(profile.id).create({...data.birthday});
    await this.gender(profile.id).create({...data.gender});

    await this.introduce(profile.id).create({
      introduce: USER_PROFILE_BIO_DEFAULT,
      isPublic: true,
      ...data.introduce,
    });
    await this.work(profile.id).create({...data.work});
    await this.website(profile.id).create({...data.website});
    await this.phone(profile.id).create({...data.phone});
    await this.address(profile.id).create({...data.address});
    return profile;
  }

  async updateById(
    id: typeof Profiles.prototype.id,
    data: Partial<Profiles> | {[P in keyof Profiles]?: DeepPartial<Profiles[P]>} | Profiles,
    options?: AnyObject,
  ): Promise<void> {
    if (data.avatars) {
      await this.avatars(id).patch({
        mediaContentId: data.avatars.mediaContentId,
      });
    }

    if (data.backgrounds) {
      await this.backgrounds(id).patch({
        mediaContentId: data.backgrounds.mediaContentId,
      });
    }

    if (data.birthday) {
      delete data.birthday.profileId;
      await this.birthday(id).patch({
        ...data.birthday,
      });
    }

    if (data.gender) {
      delete data.gender.profileId;
      await this.gender(id).patch({
        ...data.gender,
      });
      const avatars = await this.avatars(id).get({
        include: [
          {
            relation: 'mediaContent',
          },
        ],
      });
      if (
        [
          SystemDefaultAvatarMediaTypeEnum.male,
          SystemDefaultAvatarMediaTypeEnum.female,
          SystemDefaultAvatarMediaTypeEnum.unspecified,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
        ].includes(avatars.mediaContent.mediaType)
      ) {
        const gender = await this.gender(id).get();
        const defaultAvatar = await this.mediaContentsRepository.findOne({
          where: {
            mediaType: SYSTEM_DEFAULT_AVATARS(gender?.gender || USER_GENDER_UNSPECIFIED),
          },
        });
        await this.avatars(id).patch({
          mediaContentId: defaultAvatar?.id,
        });
      }
    }

    if (data.introduce) {
      delete data.introduce.profileId;
      await this.introduce(id).patch({
        ...data.introduce,
      });
    }

    if (data.address) {
      delete data.address.profileId;
      await this.address(id).patch({
        ...data.address,
      });
    }

    if (data.work) {
      delete data.work.profileId;
      await this.work(id).patch({
        ...data.work,
      });
    }

    if (data.website) {
      delete data.website.profileId;
      await this.website(id).patch({
        ...data.website,
      });
    }

    if (data.phone) {
      delete data.phone.profileId;
      await this.phone(id).patch({
        ...data.phone,
      });
    }

    await super.updateById(
      id,
      {
        ...omit(data, [
          'phone',
          'website',
          'work',
          'address',
          'introduce',
          'gender',
          'birthday',
          'backgrounds',
          'avatars',
        ]),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }

  update(entity: Profiles, options?: AnyObject): Promise<void> {
    const data = new Profiles({
      ...entity,
      updatedAt: moment().utc().toISOString(),
    });
    return super.update(data, options);
  }

  async createProfile(
    entity: Partial<Profiles> | {[P in keyof Profiles]?: DeepPartial<Profiles[P]>} | Profiles,
    options?: AnyObject,
  ): Promise<Profiles> {
    return super.create(
      {
        ...entity,
        createdAt: moment().utc().toISOString(),
        updatedAt: moment().utc().toISOString(),
      },
      options,
    );
  }
}
