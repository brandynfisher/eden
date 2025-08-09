// Character limits for memory-related components
// Centralized constants to avoid hardcoded values throughout the codebase

export const MEMORY_LIMITS = {
  // Collective Memory - Memory Content
  MEMORY_CONTENT_MAX: 3000,
  
  // Collective Memory - Extraction Prompt
  EXTRACTION_PROMPT_MIN: 100,
  EXTRACTION_PROMPT_MAX: 2000,
  
  // Collective Memory - Shard Name
  SHARD_NAME_MIN: 6,
  SHARD_NAME_MAX: 50,
  
  // Memory Sessions (facts, unabsorbed memory)
  MEMORY_SESSION_MAX: 100,
  
  // Directive Content (from agent-memory-view)
  DIRECTIVE_CONTENT_MAX: 100,
} as const

// Error messages
export const MEMORY_ERROR_MESSAGES = {
  MEMORY_CONTENT_MAX: `Memory content cannot exceed ${MEMORY_LIMITS.MEMORY_CONTENT_MAX} characters`,
  
  EXTRACTION_PROMPT_MIN: `Extraction prompt must be at least ${MEMORY_LIMITS.EXTRACTION_PROMPT_MIN} characters long`,
  EXTRACTION_PROMPT_MAX: `Extraction prompt cannot exceed ${MEMORY_LIMITS.EXTRACTION_PROMPT_MAX} characters`,
  
  SHARD_NAME_MIN: `Shard name must be at least ${MEMORY_LIMITS.SHARD_NAME_MIN} characters long`,
  SHARD_NAME_MAX: `Shard name cannot exceed ${MEMORY_LIMITS.SHARD_NAME_MAX} characters`,
  
  MEMORY_SESSION_MAX: `Memory session content cannot exceed ${MEMORY_LIMITS.MEMORY_SESSION_MAX} characters`,
  
  DIRECTIVE_CONTENT_MAX: `Directive content cannot exceed ${MEMORY_LIMITS.DIRECTIVE_CONTENT_MAX} characters`,
} as const

// UI Helper messages  
export const MEMORY_UI_MESSAGES = {
  EXTRACTION_PROMPT_MIN_REQUIRED: `Minimum ${MEMORY_LIMITS.EXTRACTION_PROMPT_MIN} characters required`,
} as const