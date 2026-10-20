#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
local_user=`logname`
local_user_home_dir=$( getent passwd "${local_user}" | cut -d: -f6 )

version=$( grep version package.json | cut -d':' -f2 | xargs | sed 's/,//' )
prebuilt_package_path="dist/kiosk-browser_${version}_amd64.deb"

if [[ ! -f ${prebuilt_package_path} ]]; then
  "${DIR}/verify-dependencies.sh"

  # Build the TypeScript files.
  yarn --offline tsc

  # Point electron-builder at the zip that `node_modules/electron/install.js` cached.
  electron_version=$( node -p "require('./node_modules/electron/package.json').version" )
  electron_zip=$( find "${local_user_home_dir}/.cache/electron" -name "electron-v${electron_version}-linux-x64.zip" | head -n 1 )
  electron_cache=$( dirname "${electron_zip}" )

  # Build .deb file.
  ELECTRON_CACHE=${electron_cache} yarn --offline app:dist

fi
