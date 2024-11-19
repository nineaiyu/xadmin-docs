FROM node:22.11.0-slim AS stage-build

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@9.12.3 --activate

ARG VERSION

COPY . .

RUN sed -i "s@VERSION=.*@VERSION=v${VERSION}@" guide/demo.md

RUN pnpm install --frozen-lockfile && pnpm run docs:build

FROM nginx:1.24-bullseye
COPY --from=stage-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
