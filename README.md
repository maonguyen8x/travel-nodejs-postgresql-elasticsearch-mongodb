# uto-server

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Quick start

1.  Make sure that you have Node.js v8.15.1 and npm v5 or above installed.<br />
2.  Clone this repo using `https://gitlab.com/utotech1/uto-server.git <YOUR_PROJECT_NAME>`.<br />
3.  Move to the appropriate directory: `cd <YOUR_PROJECT_NAME>`.<br />
4.  Deploy server: `npm run deploy`.<br />
5.  Import database: `npm run import:database`.<br />
    -   Create docker container server graphql: `npm run docker:build`.<br />
    -   Run docker container server graphql: `npm run docker:run`.<br />
    -   Run `npm run install` in order to install dependencies and clean the git repo.<br />
        _At this point you can run `npm start` to see the example app at `http://localhost:3000`._
    -   Run `npm run start:graphql` to run graphql-server.<br />
    -   Build and Up docker container: `docker-compose build && docker-compose up -d`.<br />
##  Export Database: <br />
    docker-compose exec postgresql bash
    pg_dump -U uto_tech > database.sql
    docker cp $(docker-compose ps -q postgresql):/database.sql ./demo/

##query redis
    redis-cli -h localhost -p 6379
    
##exec postgresql
    docker exec -it utoserver_postgresql_1 psql -U uto_tech -W uto_tech
    