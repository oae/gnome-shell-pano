FROM node:20.10.0-alpine3.18 AS base
RUN apk update && apk upgrade
RUN apk add gcompat openssl sqlite git openssh-client bash make glib zip
RUN apk add --no-cache tzdata
RUN ln -sf /bin/bash /bin/ash
ENV TZ=Europe/Berlin
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=development
ENV TZ=Europe/Berlin
