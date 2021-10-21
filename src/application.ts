import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {AuthorizationComponent} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingKey} from '@loopback/core';
import {RepositoryMixin, SchemaMigrationOptions} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import {omit} from 'lodash';
import path from 'path';
import {JWTAuthenticationStrategy} from './authentication-strategies/jwt-strategy';
import {HandlerBindingKeys} from './constants/handlerBindingKeys';
import {LocationsHandler} from './controllers/locations/locations.handler';
import {PageHandler} from './controllers/pages/page.handler';
import {PostsHandler} from './controllers/posts/posts.handler';
import {StaticPageHandler} from './controllers/static-page/static-page.handler';
import {UsersBlockHandler} from './controllers/user-block/users-block.handler';
import listCurrency from './data-test/currencies.json';
import listUser from './data-test/users.json';
import {
  MediaStorageProviderBindings,
  ElasticSearchServiceBindings,
  PasswordHasherBindings,
  RedisServiceBindings,
  TokenServiceBindings,
  TokenServiceConstants,
  UserServiceBindings,
} from './keys';
import {CurrencyRepository, UsersRepository} from './repositories';
import {MySequence} from './sequence';
import {MediaStorageProvider, ElasticSearchService, FirebaseService, EmailService} from './services';
import {BcryptHasher} from './services/hash.password.bcryptjs';
import {JWTService} from './services/jwt-service';
import {RedisService} from './services/redis-service';
import {MyUserService} from './services/user-services';
import {SECURITY_SCHEME_SPEC} from './utils/security-spec';
import {ServiceHandler} from './controllers/services/service.handler';
import {InterestingHandler} from './controllers/interesting/interesting.handler';
import {FeedbackHandler} from './controllers/feedback/feedback.handler';
import {BookingHandler} from './controllers/booking/booking.handler';
import {AuthHandler} from './controllers/auth/auth.handler';
import {PageReviewHandler} from './controllers/page-review/page-review.handler';
import {FacilitiesHandler} from './controllers/facilities/facilities.handler';
import {AmenitiesHandler} from './controllers/amenities/amenities.handler';
import {ActivityHandler} from './controllers/activities/activity.handler';
import {SharesHandler} from './controllers/shares/shares.handler';
import {ActivityBookmarkHandler} from './controllers/activity-bookmark/activity-bookmark.handler';
import {BookmarkHandler} from './controllers/bookmarks/bookmark.handler';
import {BookmarkLocationHandler} from './controllers/bookmark-location/bookmark-location.handler';
import {ServiceReviewHandler} from './controllers/service-review/service-review.handler';

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
export const PackageKey = BindingKey.create<PackageInfo>('application.package');

const pkg: PackageInfo = require('../package.json');

export class UtoServerApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      servers: [{url: '/'}],
    });

    this.setUpBindings();
    this.bindingHandler();

    // Set up the custom sequence
    this.sequence(MySequence);
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
      useSelfHostedSpec: false,
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  bindingHandler(): void {
    this.bind(HandlerBindingKeys.USERS_BLOCK_HANDLER).toClass(UsersBlockHandler);
    this.bind(HandlerBindingKeys.POSTS_HANDLER).toClass(PostsHandler);
    this.bind(HandlerBindingKeys.LOCATIONS_HANDLER).toClass(LocationsHandler);
    this.bind(HandlerBindingKeys.INTERESTING_HANDLER).toClass(InterestingHandler);
    this.bind(HandlerBindingKeys.STATIC_PAGE_HANDLER).toClass(StaticPageHandler);
    this.bind(HandlerBindingKeys.PAGE_HANDLER).toClass(PageHandler);
    this.bind(HandlerBindingKeys.SERVICE_HANDLER).toClass(ServiceHandler);
    this.bind(HandlerBindingKeys.FEEDBACK_HANDLER).toClass(FeedbackHandler);
    this.bind(HandlerBindingKeys.BOOKING_HANDLER).toClass(BookingHandler);
    this.bind(HandlerBindingKeys.AUTH_HANDLER).toClass(AuthHandler);
    this.bind(HandlerBindingKeys.PAGE_REVIEW_HANDLER).toClass(PageReviewHandler);
    this.bind(HandlerBindingKeys.FACILITIES_HANDLER).toClass(FacilitiesHandler);
    this.bind(HandlerBindingKeys.AMENITIES_HANDLER).toClass(AmenitiesHandler);
    this.bind(HandlerBindingKeys.ACTIVITIES_HANDLER).toClass(ActivityHandler);
    this.bind(HandlerBindingKeys.SHARES_HANDLER).toClass(SharesHandler);
    this.bind(HandlerBindingKeys.ACTIVITY_BOOKMARK_HANDLER).toClass(ActivityBookmarkHandler);
    this.bind(HandlerBindingKeys.BOOKMARK_HANDLER).toClass(BookmarkHandler);
    this.bind(HandlerBindingKeys.BOOKMARK_LOCATION_HANDLER).toClass(BookmarkLocationHandler);
    this.bind(HandlerBindingKeys.SERVICE_REVIEW_HANDLER).toClass(ServiceReviewHandler);
  }

  setUpBindings(): void {
    // Bind package.json to the application context
    this.bind(PackageKey).to(pkg);

    this.bind(TokenServiceBindings.TOKEN_SECRET).to(TokenServiceConstants.TOKEN_SECRET_VALUE);

    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE);

    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    // Bind bcrypt hash services
    this.bind(PasswordHasherBindings.ROUNDS).to(10);
    this.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);

    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
    this.bind(RedisServiceBindings.REDIS_SERVICE).toClass(RedisService);
    this.bind(ElasticSearchServiceBindings.ELASTIC_SERVICE).toClass(ElasticSearchService);
    this.bind(MediaStorageProviderBindings.MEDIA_SERVICE).toClass(MediaStorageProvider);

    const firebase = new FirebaseService();

    const emailService = new EmailService();

    this.bind('firebase').to(firebase);
    this.bind('emailService').to(emailService);
  }

  async start() {
    // Use `databaseSeeding` flag to control if products/users should be pre
    // populated into the database. Its value is default to `true`.
    // await this.migrateSchema();
    return super.start();
  }

  async migrateSchema(options?: SchemaMigrationOptions) {
    await super.migrateSchema(options);

    // Pre-populate users
    const passwordHasher = await this.get(PasswordHasherBindings.PASSWORD_HASHER);

    // create user
    const userRepo = await this.getRepository(UsersRepository);

    await userRepo.deleteAll();
    for (const user of listUser) {
      if (user) {
        const input = {
          ...user,
          email: {
            email: user.email,
            isPublic: true,
          },
        };
        const password = await passwordHasher.hashPassword(input.password);
        input.password = password;
        const users = await userRepo.create(omit(input, 'password'));
        await userRepo.usercredentials(users.id).create({password});
      }
    }

    // if (true) {

    // create location and post
    // const locaRepo = await this.getRepository(LocationsRepository);
    // await locaRepo.deleteAll();
    // for (const location of listLocation) {
    //   if (location) {
    //     // const coordinates = new loopback.GeoPoint({lat: location.latitude, lng: location.longitude}).toString()
    //     const convertLocation = {
    //       ...location,
    //       name: String(location.name),
    //       locationType: locationTypes[location.name.length % 2],
    //       coordinates: location.locGeo,
    //       formatedAddress: location.formatedAddress,
    //     };
    //     delete convertLocation.id;
    //     delete convertLocation.locGeo;
    //     await locaRepo.create(convertLocation);
    //   }
    // }

    // create currency
    const currencyRepo = await this.getRepository(CurrencyRepository);
    await currencyRepo.deleteAll();
    for (const currencyItem of listCurrency) {
      if (currencyItem) {
        await currencyRepo.create(currencyItem);
      }
    }
    // }
  }
}
