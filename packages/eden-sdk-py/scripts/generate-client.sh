#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
OPENAPI_PATH="$ROOT_DIR/apps/api/openapi/sessions-v3.yaml"
OUT_DIR="$ROOT_DIR/packages/eden-sdk-py/generated"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

docker run --rm \
  -v "$ROOT_DIR":/local \
  openapitools/openapi-generator-cli:v7.10.0 \
  generate \
  -i "/local/apps/api/openapi/sessions-v3.yaml" \
  -g python \
  -o "/local/packages/eden-sdk-py/generated" \
  --package-name eden_sdk_v3 \
  --additional-properties=projectName=eden-sdk-v3,packageVersion=0.1.0

echo "Generated Python client in $OUT_DIR"
