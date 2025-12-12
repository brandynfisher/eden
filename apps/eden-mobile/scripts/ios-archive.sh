#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Load EXPO_PUBLIC_* for the JS bundle (override with ENV_JS_FILE if set)
ENV_JS_FILE=${ENV_JS_FILE:-.env.staging}
if [[ -f "$ENV_JS_FILE" ]]; then
  echo "ℹ️  Loading JS env from $ENV_JS_FILE"
  set -a
  source "$ENV_JS_FILE"
  set +a
else
  echo "⚠️  $ENV_JS_FILE not found; continuing without injecting EXPO_PUBLIC_* envs"
fi

TEAM_ID="V58985DFSU"
ROOT_DIR="$(pwd)"

SIGN_STYLE=Manual
SIGN_ID="Apple Distribution"
PROFILE_SPECIFIER="jmill-provisioning"

# Ensure pods/codegen outputs are present (regenerates build/generated/ios if missing)
pushd ios >/dev/null
pod install
popd >/dev/null

xcodebuild \
  -workspace "$ROOT_DIR/ios/edenmobile.xcworkspace" \
  -scheme edenmobile \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ROOT_DIR/build/edenmobile-staging.xcarchive" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE="$SIGN_STYLE" \
  CODE_SIGN_IDENTITY="$SIGN_ID" \
  PROVISIONING_PROFILE_SPECIFIER="$PROFILE_SPECIFIER" \
  -allowProvisioningUpdates \
  archive
