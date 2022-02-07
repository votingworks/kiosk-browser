#!/bin/bash

set -euo pipefail

SUDO=sudo
OS=$(lsb_release -cs)

if [ "$(id --user)" = 0 ]; then
  SUDO=
fi

# Install native package build dependencies.
$SUDO apt-get install -y build-essential libudev-dev unzip git python pmount cups-client

if [[ $OS == "bullseye" ]]; then
	sudo apt install -y libgtk-3-0  libnotify4 libxssl libxtst6 xdg-utils libatspi2.0-0 kde-cli-tools kde-runtime trash-cli libglib2.0-bin gvfs-bin
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. please install it before continuing: https://nodejs.org/en/" >&2
  exit 127
fi

if ! command -v yarn >/dev/null 2>&1; then
  echo "yarn not found. please install it before continuing: https://www.yarnpkg.com/en/" >&2
  exit 127
fi

# Install kiosk-browser dependencies.
yarn install
