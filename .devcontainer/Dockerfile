FROM node:20-alpine

RUN apk update && apk upgrade && apk add gcompat openssl sqlite git openssh-client bash make glib zip && apk add --no-cache tzdata

WORKDIR /app

RUN corepack enable && corepack install -g yarn@1.22.22

ENV NODE_ENV=development
