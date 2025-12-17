#!/usr/bin/env bash
set -euo pipefail

APP_DERIVED="${HOME}/Library/Developer/Xcode/DerivedData/edenmobile-*"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Removing DerivedData: ${APP_DERIVED}"
rm -rf ${APP_DERIVED}

echo "Removing local build artifacts"
rm -rf "$ROOT/build" "$ROOT/ios/build"

echo "Clean done."
