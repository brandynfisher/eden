export const CHALLENGE_TTL = 60 * 1000

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
]
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/gif',
]

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
]

// Memory limits - MUST match frontend apps/media-playground/features/sessions/views/memory-constants.ts
export const MEMORY_LIMITS = {
  EXTRACTION_PROMPT_MIN_CHARS: 100,
  EXTRACTION_PROMPT_MAX_CHARS: 3000,
  SHARD_NAME_MIN_CHARS: 4,
  SHARD_NAME_MAX_CHARS: 50,
} as const
