#!/bin/bash

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. please install it before continuing: https://nodejs.org/en/" >&2
  exit 127
fi

if ! command -v yarn >/dev/null 2>&1; then
  echo "yarn not found. please install it before continuing: https://www.yarnpkg.com/en/" >&2
  exit 127
fi

if ! command -v fpm >/dev/null 2>&1; then
  echo "fpm not found. please install it before continuing: https://fpm.readthedocs.io/en/latest/" >&2
  exit 127
fi
