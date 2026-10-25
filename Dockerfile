FROM node:24.20.0-slim AS stage-build

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@11.25.0 --activate

ARG VERSION

COPY . .

# 版本入参归一化 v 前缀（与 build.sh 同口径）：镜像 tag 不含 v，文档命令形态带 v，
# 不归一化会在 workflow 改传带 v 版本时产出 vvX.Y.Z
RUN sed -i "s@VERSION=.*@VERSION=v${VERSION/v/}@" guide/demo.md

RUN pnpm install --frozen-lockfile && pnpm run docs:build

FROM nginx:1.31.5-alpine
COPY --from=stage-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
