import { ArtifactPermissionLevelV3 } from '../models/v3/ArtifactPermissionV3'

type PermissionLevel = ArtifactPermissionLevelV3

const PERMISSION_WEIGHT: Record<PermissionLevel, number> = {
  [ArtifactPermissionLevelV3.Viewer]: 1,
  [ArtifactPermissionLevelV3.Editor]: 2,
  [ArtifactPermissionLevelV3.Owner]: 3,
}

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export const getPermissionWeight = (level?: PermissionLevel | null) => {
  if (!level) {
    return 0
  }
  return PERMISSION_WEIGHT[level] ?? 0
}

export const maxPermissionLevel = (
  levels: Array<PermissionLevel | null | undefined>,
): PermissionLevel | null => {
  let best: PermissionLevel | null = null
  for (const level of levels) {
    if (!level) {
      continue
    }
    if (!best || PERMISSION_WEIGHT[level] > PERMISSION_WEIGHT[best]) {
      best = level
    }
  }
  return best
}

/**
 * Validates a JSON Pointer path (RFC 6901) for use with JSON Patch operations.
 * Paths must start with "/" and contain valid segments.
 */
export const validateJsonPointer = (path: string): boolean => {
  if (!path || !path.startsWith('/')) {
    return false
  }
  const segments = path.slice(1).split('/')
  if (segments.length === 0) {
    return false
  }
  return segments.every(segment => {
    if (RESERVED_KEYS.has(segment)) {
      return false
    }
    // Allow numeric indices for arrays
    if (/^\d+$/.test(segment)) {
      return true
    }
    // Allow "-" for appending to arrays
    if (segment === '-') {
      return true
    }
    // Disallow empty segments (except for root)
    if (!segment && segments.length > 1) {
      return false
    }
    return true
  })
}

/**
 * Converts a JSON Pointer path to a dot-notation path for backward compatibility.
 * Example: "/characters/0/name" -> "characters.0.name"
 */
export const jsonPointerToDotPath = (pointer: string): string => {
  if (!pointer.startsWith('/')) {
    return pointer
  }
  return pointer.slice(1).split('/').join('.')
}

/**
 * Converts a dot-notation path to a JSON Pointer path.
 * Example: "characters.0.name" -> "/characters/0/name"
 */
export const dotPathToJsonPointer = (dotPath: string): string => {
  if (dotPath.startsWith('/')) {
    return dotPath
  }
  return '/' + dotPath.split('.').join('/')
}

/**
 * Sanitizes items input, allowing proper JSON types (arrays, nested objects,
 * numbers, booleans, null) instead of string-coercing.
 */
export const sanitizeItemsInput = (
  items: unknown,
  pathPrefix = 'items',
): { sanitized: Record<string, unknown>; errors: string[] } => {
  const errors: string[] = []

  if (!items || typeof items !== 'object' || Array.isArray(items)) {
    return { sanitized: {}, errors }
  }

  const sanitizeValue = (value: unknown, path: string): unknown => {
    if (value === null || value === undefined) {
      return null
    }
    if (typeof value === 'string') {
      return value
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value
    }
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        sanitizeValue(item, `${path}[${index}]`),
      )
    }
    if (typeof value === 'object') {
      return sanitizeObject(value as Record<string, unknown>, path)
    }
    errors.push(`Invalid value at "${path}"`)
    return null
  }

  const sanitizeObject = (
    obj: Record<string, unknown>,
    path: string,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (!key || key.includes('$') || RESERVED_KEYS.has(key)) {
        errors.push(`Invalid key "${path}.${key}"`)
        continue
      }
      const nextPath = `${path}.${key}`
      result[key] = sanitizeValue(value, nextPath)
    }
    return result
  }

  return {
    sanitized: sanitizeObject(items as Record<string, unknown>, pathPrefix),
    errors,
  }
}
