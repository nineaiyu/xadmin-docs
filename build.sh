#!/bin/bash
#
#
# clean old build docker and image
docker rm -f xadmin-docs-build
docker image rm xadmin-docs-build

# build web
docker compose up xadmin-docs-build
