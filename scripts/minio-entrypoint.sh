#!/bin/sh
set -e

# Start Minio server
minio server --console-address ":9001" /data

# Wait for Minio server to start
echo "Waiting for Minio server to start..."
until curl --silent --fail http://localhost:9001 >/dev/null; do
    printf '.'
    sleep 1
done
echo "Minio server started."

# Create the buckets
mc alias set minio http://localhost:9000 eden12345 eden12345
mc mb minio/minio-dummy
mc mb minio/minio-eden

# Make all objects in the buckets public
mc anonymous set public minio/minio-dummy
mc anonymous set public minio/minio-eden