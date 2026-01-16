#!/usr/bin/env bash
set -euo pipefail

export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"

expo run:android
