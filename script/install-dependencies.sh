#!/bin/bash

set -euo pipefail

SUDO=sudo
OS=$(lsb_release -cs)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$(id --user)" = 0 ]; then
  SUDO=
fi

# Install native package build dependencies.
$SUDO apt-get install -y \
  build-essential \
  libudev-dev \
  unzip \
  git \
  python3 \
  cups-client \
  ruby

if [[ $OS == "bullseye" ]]; then
	$SUDO apt install -y libgtk-3-0  libnotify4 libxss1 libxtst6 xdg-utils libatspi2.0-0 kde-cli-tools trash-cli libglib2.0-bin gvfs-bin cups cups-bsd
fi

$SUDO gem install fpm

"${DIR}/verify-dependencies.sh"

# Install kiosk-browser dependencies.
yarn install
