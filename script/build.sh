#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

"${DIR}/verify-dependencies.sh"

# Install dependencies if not already installed.
yarn install

# Build the TypeScript files.
yarn tsc

# Build .deb file.
yarn app:dist
