# syntax=docker/dockerfile:1

FROM mongo:7.0

ENV MONGO_INITDB_DATABASE=WhatToWatch

COPY movies.json /docker-entrypoint-initdb.d/movies.json
COPY tv_shows.json /docker-entrypoint-initdb.d/tv_shows.json
COPY docker/mongo-init.sh /docker-entrypoint-initdb.d/mongo-init.sh

RUN chmod +x /docker-entrypoint-initdb.d/mongo-init.sh
