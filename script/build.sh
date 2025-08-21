#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
local_user=`logname`
local_user_home_dir=$( getent passwd "${local_user}" | cut -d: -f6 )

version=$( grep version package.json | cut -d':' -f2 | xargs | sed 's/,//' )
prebuilt_package_url="https://votingworks-apt-snapshots.s3.us-west-2.amazonaws.com/kiosk-browser_${version}_amd64.deb"

curl --output-dir dist/kiosk-browser_${version}_amd64.deb -O ${prebuilt_package_url} || {
  "${DIR}/verify-dependencies.sh"

  # Build the TypeScript files.
  yarn --offline tsc

  # Get the electron cache dir
  electron_timestamp=`ls ${local_user_home_dir}/.cache/electron/`
  electron_cache="${local_user_home_dir}/.cache/electron/${electron_timestamp}"

  # Build .deb file.
  ELECTRON_SKIP_BINARY_DOWNLOAD=1 ELECTRON_CACHE=${electron_cache} yarn --offline app:dist

}
