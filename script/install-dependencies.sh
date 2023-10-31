#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

"${DIR}/verify-dependencies.sh"

# Install kiosk-browser dependencies.
pnpm install --frozen-lockfile
