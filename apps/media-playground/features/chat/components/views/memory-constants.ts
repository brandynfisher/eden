// Character limits for memory-related components
// Centralized constants to avoid hardcoded values throughout the codebase

export const MEMORY_LIMITS = {
  // Collective Memory - Memory Content
  MEMORY_CONTENT_MAX_CHARS: 7000,
  
  // Collective Memory - Extraction Prompt
  EXTRACTION_PROMPT_MIN_CHARS: 100,
  EXTRACTION_PROMPT_MAX_CHARS: 3000,
  
  // Collective Memory - Shard Name
  SHARD_NAME_MIN_CHARS: 4,
  SHARD_NAME_MAX_CHARS: 50,
  
  // Memory Sessions - Facts & Unabsorbed Memory Content
  FACTS_MAX_CHARS: 200,
  
  // Agent Memory - Directive Content
  DIRECTIVE_CONTENT_MAX_CHARS: 200,
  
  // User Memory Content
  USER_MEMORY_CONTENT_MAX_CHARS: 2500,
} as const

// Error messages
export const MEMORY_ERROR_MESSAGES = {
  MEMORY_CONTENT_MAX_CHARS: `Memory content cannot exceed ${MEMORY_LIMITS.MEMORY_CONTENT_MAX_CHARS} characters`,
  
  EXTRACTION_PROMPT_MIN_CHARS: `Extraction prompt must be at least ${MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS} characters long`,
  EXTRACTION_PROMPT_MAX_CHARS: `Extraction prompt cannot exceed ${MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS} characters`,
  
  SHARD_NAME_MIN_CHARS: `Shard name must be at least ${MEMORY_LIMITS.SHARD_NAME_MIN_CHARS} characters long`,
  SHARD_NAME_MAX_CHARS: `Shard name cannot exceed ${MEMORY_LIMITS.SHARD_NAME_MAX_CHARS} characters`,
  
  FACTS_MAX_CHARS: `Facts content cannot exceed ${MEMORY_LIMITS.FACTS_MAX_CHARS} characters`,
  
  DIRECTIVE_CONTENT_MAX_CHARS: `Directive content cannot exceed ${MEMORY_LIMITS.DIRECTIVE_CONTENT_MAX_CHARS} characters`,
  
  USER_MEMORY_CONTENT_MAX_CHARS: `User memory content cannot exceed ${MEMORY_LIMITS.USER_MEMORY_CONTENT_MAX_CHARS} characters`,
} as const

// UI Helper messages  
export const MEMORY_UI_MESSAGES = {
  EXTRACTION_PROMPT_MIN_REQUIRED: `Minimum ${MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS} characters required`,
} as const