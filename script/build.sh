#!/bin/bash

set -euo pipefail

# Install dependencies if not already installed.
yarn install

# Build .deb file.
yarn make
