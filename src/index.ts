import {ApplicationConfig} from '@loopback/core';
import {UtoServerApplication} from './application';

export {UtoServerApplication};

export async function main(options: ApplicationConfig = {}) {
  const app = new UtoServerApplication(options);
  await app.boot();
  // await app.migrateSchema();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/users`);

  return app;
}
