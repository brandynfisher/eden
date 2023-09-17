#!/bin/sh
set -e

# Wait for Minio server to start
echo "Waiting for Minio server to start..."
while ! curl -I http://minio:9000/minio/health/live; do echo 'Wait minio to startup...' && sleep 0.1; done
echo "Minio server started."

# Create the buckets
mc alias set minio http://minio:9000 eden12345 eden12345
if ! mc ls minio/minio-dummy; then
    mc mb minio/minio-dummy
fi

if ! mc ls minio/minio-eden; then
    mc mb minio/minio-eden
fi

# Make all objects in the buckets public
mc anonymous set public minio/minio-dummy
mc anonymous set public minio/minio-eden
