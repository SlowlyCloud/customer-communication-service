FROM node:16-alpine

ARG NODE_ENV

ENV NODE_ENV=${NODE_ENV:-production}

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json package.json

RUN yarn install && yarn global add pm2

COPY . .

EXPOSE 3000

CMD ["pm2-runtime", "src/app.js", "-i", "max"]   