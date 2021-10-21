import {TokenService, UserService} from '@loopback/authentication';
import {BindingKey} from '@loopback/context';
import {Users} from './models';
import {Credentials} from './repositories';
import {ElasticSearchService, FirebaseService, MediaStorageProvider} from './services';
import {PasswordHasher} from './services/hash.password.bcryptjs';
import {RedisService} from './services/redis-service';
export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = 'myjwts3cr3t';
  export const TOKEN_EXPIRES_IN_VALUE = '2592000';
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>('authentication.jwt.secret');
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>('authentication.jwt.expires.in.seconds');
  export const TOKEN_SERVICE = BindingKey.create<TokenService>('services.authentication.jwt.tokenservice');
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>('services.hasher');
  export const ROUNDS = BindingKey.create<number>('services.hasher.round');
}

export namespace UserServiceBindings {
  export const USER_SERVICE = BindingKey.create<UserService<Users, Credentials>>('services.user.service');
}

export namespace RedisServiceBindings {
  export const REDIS_SERVICE = BindingKey.create<RedisService>('services.redis.service');
}

export namespace MediaStorageProviderBindings {
  export const MEDIA_SERVICE = BindingKey.create<MediaStorageProvider>('services.media.storage');
}

export namespace ElasticSearchServiceBindings {
  export const ELASTIC_SERVICE = BindingKey.create<ElasticSearchService>('services.elastic.service');
}

export namespace FirebaseServiceBindings {
  export const FIREBASE_SERVICE = BindingKey.create<FirebaseService>('services.firebase.service');
}
