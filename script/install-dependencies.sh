#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

"${DIR}/verify-dependencies.sh"

# Install kiosk-browser dependencies.
yarn install --frozen-lockfile

version=$( grep version package.json | cut -d':' -f2 | xargs | sed 's/,//' )
prebuilt_package_url="https://votingworks-apt-snapshots.s3.us-west-2.amazonaws.com/kiosk-browser_${version}_amd64.deb"

mkdir -p dist

curl -f --output-dir dist -O ${prebuilt_package_url} || echo "Couldn't download file, will build from source"
