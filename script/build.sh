#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

"${DIR}/verify-dependencies.sh"

# Build the TypeScript files.
yarn --offline tsc

# Get the electron cache dir
electron_timestamp=`ls ~/.cache/electron/`
electron_cache="~/.cache/electron/${electron_timestamp}"

# Build .deb file.
ELECTRON_CACHE=${electron_cache} yarn --offline app:dist
