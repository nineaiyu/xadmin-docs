FROM node:24.20.0-slim AS stage-build

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@11.25.0 --activate

ARG VERSION

COPY . .

RUN sed -i "s@VERSION=.*@VERSION=v${VERSION}@" guide/demo.md

RUN pnpm install --frozen-lockfile && pnpm run docs:build

FROM nginx:1.31.5-alpine
COPY --from=stage-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
