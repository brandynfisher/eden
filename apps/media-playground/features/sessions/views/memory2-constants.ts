// Character limits for memory2-related components
// Centralized constants to avoid hardcoded values throughout the codebase

export const MEMORY2_LIMITS = {
  // Consolidated memory blobs
  AGENT_CONSOLIDATED_MAX_CHARS: 8000, // ~1000 words
  USER_CONSOLIDATED_MAX_CHARS: 3200, // ~400 words

  // Individual items
  REFLECTION_MAX_CHARS: 280, // ~35 words
  FACT_MAX_CHARS: 240, // ~30 words
} as const

// Error messages
export const MEMORY2_ERROR_MESSAGES = {
  AGENT_CONSOLIDATED_MAX_CHARS: `Agent memory cannot exceed ${MEMORY2_LIMITS.AGENT_CONSOLIDATED_MAX_CHARS} characters`,
  USER_CONSOLIDATED_MAX_CHARS: `User memory cannot exceed ${MEMORY2_LIMITS.USER_CONSOLIDATED_MAX_CHARS} characters`,
  REFLECTION_MAX_CHARS: `Reflection cannot exceed ${MEMORY2_LIMITS.REFLECTION_MAX_CHARS} characters`,
  FACT_MAX_CHARS: `Fact cannot exceed ${MEMORY2_LIMITS.FACT_MAX_CHARS} characters`,
} as const

// Format relative age from a date string (e.g., "5 minutes old", "2 days old")
export function formatRelativeAge(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) {
    return 'just now'
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} old`
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} old`
  } else if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} old`
  } else if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`
  } else {
    return `${months} ${months === 1 ? 'month' : 'months'} old`
  }
}
