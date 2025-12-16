#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT_DIR="$(pwd)"

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

# Determine build type from env file name
if [[ "$ENV_JS_FILE" == *"production"* ]]; then
  BUILD_TYPE="production"
else
  BUILD_TYPE="staging"
fi

TEAM_ID="V58985DFSU"
SIGN_STYLE=Manual
SIGN_ID="Apple Distribution"
PROFILE_SPECIFIER="jmill-provisioning"

# App name from app.json
APP_NAME="Eden"
SCHEME="Eden"

# Ensure native project is generated with latest config
echo "ℹ️  Running expo prebuild..."
npx expo prebuild --platform ios --clean

# Ensure pods are installed
pushd ios >/dev/null
pod install
popd >/dev/null

echo "ℹ️  Building $APP_NAME ($BUILD_TYPE)..."

xcodebuild \
  -workspace "$ROOT_DIR/ios/$APP_NAME.xcworkspace" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ROOT_DIR/build/$APP_NAME-$BUILD_TYPE.xcarchive" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE="$SIGN_STYLE" \
  CODE_SIGN_IDENTITY="$SIGN_ID" \
  PROVISIONING_PROFILE_SPECIFIER="$PROFILE_SPECIFIER" \
  -allowProvisioningUpdates \
  archive

echo "✅ Archive created: $ROOT_DIR/build/$APP_NAME-$BUILD_TYPE.xcarchive"
