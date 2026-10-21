#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

version=$( grep version package.json | cut -d':' -f2 | xargs | sed 's/,//' )
prebuilt_package_path="dist/kiosk-browser_${version}_amd64.deb"

if [[ ! -f ${prebuilt_package_path} ]]; then
  "${DIR}/verify-dependencies.sh"

  # Build the TypeScript files.
  pnpm exec tsc

  # Build .deb file.
  pnpm app:dist

fi
