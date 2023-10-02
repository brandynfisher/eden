FROM minio/mc:latest

COPY scripts/migrations/minio-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]