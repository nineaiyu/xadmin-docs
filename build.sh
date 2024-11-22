#!/bin/bash
#

VERSION=$1

node_images="registry.cn-beijing.aliyuncs.com/nineaiyu/node:22.11.0-slim"

npm_mirror="https://registry.npmmirror.com"



if [[ -n ${VERSION} ]]; then
sed -i "s@VERSION=.*@VERSION=v${VERSION/v/}@" guide/demo.md
fi


cmd='corepack enable && corepack prepare pnpm@9.12.3 --activate \
    && cd /app && pnpm install --frozen-lockfile && pnpm run docs:build'

docker run --rm -it -v ./:/app -e TZ=Asia/Shanghai \
    -e COREPACK_NPM_REGISTRY=${npm_mirror} \
    -e npm_config_registry=${npm_mirror} \
    ${node_images} sh -c "${cmd}"
