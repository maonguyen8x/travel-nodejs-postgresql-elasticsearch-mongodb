FROM node:10-slim

# Set to a non-root built-in user `node`
#USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/web/app

WORKDIR /home/web/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node ./packages/utotech/package*.json ./

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    git --version && \
    apt-get install ca-certificates -y

RUN npm install pm2@latest -g

RUN npm install

# Bundle app source code
COPY --chown=node ./packages/utotech/ .

RUN npm run clean

RUN npm run build

#RUN npm i openapi-to-graphql

# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3000 PORT2=3001

EXPOSE ${PORT}
CMD (npm run migrations:up) ; (npm run migrations:import) ; (pm2 link qseixvr9qkk6i96 hnx0ni9fy6udpbf); (npm run start-pm2 &) ; (sleep 10) ; (npx openapi-to-graphql --simpleNames --singularNames http://${HOST}:${PORT}/openapi.json -p 3001)
