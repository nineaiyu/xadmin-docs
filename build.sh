#!/bin/bash
#
#

# build web
docker compose up xadmin-docs-build
# clean old build docker
docker rm -f xadmin-docs-build
