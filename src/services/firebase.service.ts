import {bind, /* inject, */ BindingScope} from '@loopback/core';
import firebase from 'firebase-admin';
import firebaseCredentialDev from './specs/dev_utotechzone_firebase_admin.json';
import firebaseCredentialProd from './specs/prod_utotechzone_firebase_admin.json';
const firebaseCredential = {
  development: firebaseCredentialDev,
  production: firebaseCredentialProd,
};

const firebaseDatabaseUrl = {
  development: 'https://jgooooo-dev.firebaseio.com',
  production: 'https://uto-tech-zone.firebaseio.com',
};

@bind({scope: BindingScope.TRANSIENT})
export class FirebaseService {
  public app: firebase.app.App;
  public message: firebase.messaging.Messaging;

  constructor(/* Add @inject to inject parameters */) {
    this.app = firebase.initializeApp({
      // @ts-ignore
      credential: firebase.credential.cert(firebaseCredential[String(process.env.PROJECT_EVN_TYPE || 'development')]),
      // @ts-ignore
      databaseURL: firebaseDatabaseUrl[String(process.env.PROJECT_EVN_TYPE || 'development')],
    });
    this.message = this.app.messaging();
  }
}
