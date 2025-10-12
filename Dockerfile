# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY backend backend
COPY frontend frontend
COPY db db
COPY movies.json tv_shows.json ./

ENV NODE_ENV=production \
    PORT=3000

CMD ["node", "backend/server.js"]
