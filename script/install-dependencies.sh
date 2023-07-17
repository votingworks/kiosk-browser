#!/bin/bash

set -euo pipefail

SUDO=sudo
OS=$(lsb_release -cs)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$(id --user)" = 0 ]; then
  SUDO=
fi

$SUDO gem install fpm

"${DIR}/verify-dependencies.sh"

# Install kiosk-browser dependencies.
yarn install
