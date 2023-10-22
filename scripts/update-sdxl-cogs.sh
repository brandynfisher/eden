#!/bin/bash

# Version Id for image and video cogs
XXX=$1
YYY=$2

# Check if XXX and YYY are provided and non-blank
if [ -z "$XXX" ] || [ -z "$YYY" ]; then
  echo "Error: Both XXX and YYY must be provided and non-blank."
  exit 1
fi

# Update image cogs for both stage and main
node mongo-update-generator.js eden-sd-pipelines-sdxl stage $XXX
node mongo-set-generator-default.js eden-sd-pipelines-sdxl stage $XXX
node mongo-update-generator.js eden-sd-pipelines-sdxl eden $XXX
node mongo-set-generator-default.js eden-sd-pipelines-sdxl eden $XXX

# Update video cogs for both stage and main
node mongo-update-generator.js eden-sd-pipelines-sdxl-video stage $YYY
node mongo-set-generator-default.js eden-sd-pipelines-sdxl-video stage $YYY
node mongo-update-generator.js eden-sd-pipelines-sdxl-video eden $YYY
node mongo-set-generator-default.js eden-sd-pipelines-sdxl-video eden $YYY
