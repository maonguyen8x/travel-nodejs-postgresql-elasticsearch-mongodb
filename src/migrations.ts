import {Client} from 'pg';
import {readFileSync, readdirSync} from 'fs';
import {join} from 'path';
import minimist from 'minimist';
import logger from './utils/logger';

const upFolder = '../migrations/up/';
const importFolder = '../migrations/import/';
const dbConfig = {
  user: process.env.POSTGRESQL_DBUSER || 'uto_username_prod',
  host: process.env.POSTGRESQL_HOST || '125.212.238.251',
  database: process.env.POSTGRESQL_DBNAME || 'uto_tech',
  password: process.env.POSTGRESQL_DBPASS || 'uto_password_prod_rwwUm56Xk6rZbnDe',
  port: process.env.POSTGRESQL_PORT ? parseInt(process.env.POSTGRESQL_PORT) : 5432,
};

const parseArgvs = (argv: {_: string[]}) => {
  const argvs = argv['_'];
  let result: {[key: string]: string} = {};

  for (let i = 0; i < argvs.length; i++) {
    const element = argvs[i];
    const [key, value] = element.split('=');
    result = {...result, [key]: value};
  }

  return result;
};

const upSql = async (): Promise<void> => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const sqlFiles = readdirSync(join(__dirname, upFolder));

    for (let i = 0; i < sqlFiles.length; i++) {
      const file = sqlFiles[i];
      const path = join(__dirname, upFolder, file);
      const sql = readFileSync(path, {encoding: 'utf-8'});

      logger.info(sql);
      await client.query(sql);
    }

    await client.end();
  } catch (error) {
    logger.error(error.stack);
    await client.end();
  }
};

const importSql = async (): Promise<void> => {
  const client = new Client(dbConfig);
  try {
    await client.connect();

    const sqlFiles = readdirSync(join(__dirname, importFolder));

    for (let i = 0; i < sqlFiles.length; i++) {
      const file = sqlFiles[i];
      const path = join(__dirname, importFolder, file);
      const sql = readFileSync(path, {encoding: 'utf-8'});
      const rowCount = (await client.query(`SELECT * FROM importlogs WHERE filename = '${file}'`))['rowCount'];

      if (!rowCount) {
        logger.info(sql);
        await client.query(sql);
        await client.query(`INSERT INTO public.importlogs (filename) VALUES('${file}');`);
      }
    }

    await client.end();
  } catch (error) {
    logger.error(error.stack);
    await client.end();
  }
};

const actions: {[key: string]: any} = {
  up: upSql,
  import: importSql,
};

const migrations = async () => {
  const argvs = parseArgvs(minimist(process.argv.slice(2)));
  const action = argvs['action'];
  if (!actions[action]) throw new Error('Action not found');

  return actions[action]();
};

migrations();
