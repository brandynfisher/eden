export const DATA_EXPORTS = {
  MAX_ACTIVE_PER_USER: 1,
  MAX_PER_DAY_PER_USER: 3,
  MAX_DOWNLOADS_PER_EXPORT: 5,
  FILES_LIMIT: 5000,
  SIZE_LIMIT_BYTES: 2 * 1024 * 1024 * 1024, // 2 GB
  DOWNLOAD_URL_TTL_SECONDS: 60 * 60, // 1 hour
  EXPIRATION_HOURS: 48,
  HEAD_CONCURRENCY: 10,
  DEFAULT_DATE_RANGE_DAYS: 30,
} as const

export const DEFAULT_EXPORT_FILTERS = {
  include_chats: true,
  include_media_files: true,
  media_types: ['images', 'videos', 'audio'] as const,
} as const
