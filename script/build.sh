#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
local_user=`logname`
local_user_home_dir=$( getent passwd "${local_user}" | cut -d: -f6 )

"${DIR}/verify-dependencies.sh"

# Build the TypeScript files.
yarn --offline tsc

# Get the electron cache dir
electron_timestamp=`ls ${local_user_home_dir}/.cache/electron/`
electron_cache="${local_user_home_dir}/.cache/electron/${electron_timestamp}"

# Build .deb file.
ELECTRON_CACHE=${electron_cache} yarn --offline app:dist
