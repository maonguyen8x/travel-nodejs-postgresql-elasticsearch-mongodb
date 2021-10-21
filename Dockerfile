FROM node:10

WORKDIR /app

COPY . /app

RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin && \
    npm install && \
    npm run build && \
    npm prune --production

RUN /usr/local/bin/node-prune

FROM mhart/alpine-node:10

RUN apk add --no-cache supervisor

ENV PATH=/usr/app/node_modules/.bin:$PATH APP_ENV=dev

WORKDIR /usr/app

COPY --from=0 /app/dist ./dist
COPY --from=0 /app/node_modules ./node_modules
COPY --from=0 /app/package*.json /app/index.js ./
COPY --from=0 /app/src/images ./dist/images
COPY ./environments/${APP_ENV}/supervisord.conf /etc/supervisord.conf

# tasks management
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
