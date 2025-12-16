#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.android-release}"       # signing + secrets
ENV_JS_FILE="${ENV_JS_FILE:-$ROOT_DIR/.env.release}"         # EXPO_PUBLIC_* values baked into bundle
LOCAL_PROPERTIES="$ANDROID_DIR/local.properties"
# Keep Gradle caches local to the repo so we don't fight global ~/.gradle permissions/locks.
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$ROOT_DIR/.gradle-cache}"

# Ensure a JDK is available (Gradle needs a JDK, not just a JRE).
if ! command -v javac >/dev/null 2>&1; then
  echo "❌ No JDK detected (javac not on PATH). Install a JDK (Temurin 17 recommended) and retry." >&2
  echo "   macOS example: brew install --cask temurin17" >&2
  exit 1
fi

# Prefer Java 17–21 (React Native/Gradle supported). Refuse older/newer to avoid cryptic plugin errors.
require_supported_jdk() {
  local v
  v=$(javac -version 2>&1 | awk '{print $2}')
  local major=${v%%.*}
  if [[ $major -ge 17 && $major -le 21 ]]; then
    return 0
  fi
  echo "❌ Unsupported JDK version $v detected. Use Java 17–21 (Temurin 17 recommended)." >&2
  echo "   macOS example: brew install --cask temurin17" >&2
  exit 1
}

# If JAVA_HOME isn't set, try to infer JDK 17 on macOS; otherwise fall back to PATH.
if [[ -z "${JAVA_HOME:-}" && $(uname) == "Darwin" ]]; then
  if JAVA_CANDIDATE=$( /usr/libexec/java_home -v 17 2>/dev/null ); then
    export JAVA_HOME="$JAVA_CANDIDATE"
    echo "ℹ️  JAVA_HOME set to $JAVA_CANDIDATE"
  fi
fi

require_supported_jdk

# Ensure Android SDK path is set for Gradle (local.properties preferred over env var).
if [[ -z "${ANDROID_HOME:-}" ]]; then
  # Common macOS path installed by Android Studio / command-line tools.
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  fi
fi

if [[ -n "${ANDROID_HOME:-}" && ! -f "$LOCAL_PROPERTIES" ]]; then
  echo "sdk.dir=${ANDROID_HOME//\//\\/}" > "$LOCAL_PROPERTIES"
  echo "ℹ️  Wrote sdk.dir to $LOCAL_PROPERTIES"
fi

if [[ ! -f "$LOCAL_PROPERTIES" ]]; then
  cat >&2 <<'EOF'
❌ Android SDK not configured. Set ANDROID_HOME to your SDK path or create android/local.properties with:
    sdk.dir=/path/to/Android/sdk
EOF
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  echo "ℹ️  Loading release secrets from $ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
else
  echo "⚠️  $ENV_FILE not found. Set ENV_FILE to a custom path or export env vars manually."
fi

# Load JS bundle env (EXPO_PUBLIC_*). These get inlined at build time by Metro/Expo.
if [[ -f "$ENV_JS_FILE" ]]; then
  echo "ℹ️  Loading JS env from $ENV_JS_FILE"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_JS_FILE"
  set +a
else
  echo "⚠️  $ENV_JS_FILE not found. Using current shell env for EXPO_PUBLIC_* vars."
fi

# Resolve keystore path before changing directories; allow relative paths from repo root.
KEYSTORE_PATH_RAW="${KEYSTORE_PATH:-$ROOT_DIR/my-upload-key.keystore}"
if [[ "$KEYSTORE_PATH_RAW" = /* ]]; then
  KEYSTORE_PATH="$KEYSTORE_PATH_RAW"
else
  KEYSTORE_PATH="$ROOT_DIR/${KEYSTORE_PATH_RAW#./}"
fi

echo "ℹ️  Using keystore: $KEYSTORE_PATH"
if [[ ! -f "$KEYSTORE_PATH" ]]; then
  echo "❌ Keystore not found at $KEYSTORE_PATH" >&2
  exit 1
fi

: "${RELEASE_KEY_ALIAS:?Set RELEASE_KEY_ALIAS in $ENV_FILE or env}" \
: "${RELEASE_KEY_PASSWORD:?Set RELEASE_KEY_PASSWORD in $ENV_FILE or env}"
RELEASE_STORE_PASSWORD=${RELEASE_STORE_PASSWORD:-$RELEASE_KEY_PASSWORD}

# Ensure native project is generated with latest config (google-services.json, etc.)
echo "ℹ️  Running expo prebuild..."
cd "$ROOT_DIR"
npx expo prebuild --platform android --clean

# Inject versionCode from android-version.json (survives prebuild --clean)
VERSION_FILE="$ROOT_DIR/android-version.json"
if [[ -f "$VERSION_FILE" ]]; then
  VERSION_CODE=$(node -e "console.log(require('$VERSION_FILE').versionCode)")
  GRADLE_FILE="$ANDROID_DIR/app/build.gradle"
  if [[ -f "$GRADLE_FILE" ]]; then
    sed -i.bak "s/versionCode [0-9]*/versionCode $VERSION_CODE/" "$GRADLE_FILE"
    rm -f "$GRADLE_FILE.bak"
    echo "ℹ️  Set versionCode to $VERSION_CODE"
  fi
else
  echo "⚠️  android-version.json not found, using default versionCode"
fi

cd "$ANDROID_DIR"

./gradlew clean \
  -PRELEASE_STORE_FILE="$KEYSTORE_PATH" \
  -PRELEASE_STORE_PASSWORD="$RELEASE_STORE_PASSWORD" \
  -PRELEASE_KEY_ALIAS="$RELEASE_KEY_ALIAS" \
  -PRELEASE_KEY_PASSWORD="$RELEASE_KEY_PASSWORD" \
  assembleRelease bundleRelease

APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
AAB_PATH="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

echo "✅ Release APK: $APK_PATH"
echo "✅ Release AAB: $AAB_PATH"
