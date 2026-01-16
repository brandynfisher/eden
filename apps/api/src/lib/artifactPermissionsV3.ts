import { ArtifactPermissionLevelV3 } from '../models/v3/ArtifactPermissionV3'

type PermissionLevel = ArtifactPermissionLevelV3

const PERMISSION_WEIGHT: Record<PermissionLevel, number> = {
  [ArtifactPermissionLevelV3.Viewer]: 1,
  [ArtifactPermissionLevelV3.Editor]: 2,
  [ArtifactPermissionLevelV3.Owner]: 3,
}

const WILDCARD_SINGLE = '*'
const WILDCARD_MULTI = '**'
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

const splitPath = (path: string) =>
  path
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean)

const matchSegments = (
  patternSegments: string[],
  pathSegments: string[],
  patternIndex = 0,
  pathIndex = 0,
): boolean => {
  if (patternIndex >= patternSegments.length) {
    return pathIndex >= pathSegments.length
  }

  const token = patternSegments[patternIndex]

  if (token === WILDCARD_MULTI) {
    if (patternIndex === patternSegments.length - 1) {
      return true
    }
    for (let i = pathIndex; i <= pathSegments.length; i += 1) {
      if (matchSegments(patternSegments, pathSegments, patternIndex + 1, i)) {
        return true
      }
    }
    return false
  }

  if (pathIndex >= pathSegments.length) {
    return false
  }

  if (token === WILDCARD_SINGLE || token === pathSegments[pathIndex]) {
    return matchSegments(
      patternSegments,
      pathSegments,
      patternIndex + 1,
      pathIndex + 1,
    )
  }

  return false
}

export const matchKeyPattern = (pattern: string, keyPath: string) => {
  const patternSegments = splitPath(pattern)
  const pathSegments = splitPath(keyPath)
  if (!patternSegments.length || !pathSegments.length) {
    return false
  }
  return matchSegments(patternSegments, pathSegments)
}

const patternSpecificity = (pattern: string) => {
  const segments = splitPath(pattern)
  let literalCount = 0
  let wildcardCount = 0
  for (const segment of segments) {
    if (segment === WILDCARD_MULTI || segment === WILDCARD_SINGLE) {
      wildcardCount += 1
    } else {
      literalCount += 1
    }
  }
  return {
    literalCount,
    wildcardCount,
    length: segments.length,
  }
}

export const selectMostSpecificPattern = (
  patterns: string[],
): string | null => {
  if (!patterns.length) {
    return null
  }
  return patterns.sort((a, b) => {
    const aScore = patternSpecificity(a)
    const bScore = patternSpecificity(b)

    if (aScore.literalCount !== bScore.literalCount) {
      return bScore.literalCount - aScore.literalCount
    }
    if (aScore.wildcardCount !== bScore.wildcardCount) {
      return aScore.wildcardCount - bScore.wildcardCount
    }
    return bScore.length - aScore.length
  })[0]
}

export const validateKeyPath = (path: string) => {
  if (!path) {
    return false
  }
  const segments = splitPath(path)
  if (!segments.length) {
    return false
  }
  return segments.every(segment => {
    if (!segment) {
      return false
    }
    if (RESERVED_KEYS.has(segment)) {
      return false
    }
    if (segment.includes('$')) {
      return false
    }
    return segment !== WILDCARD_MULTI && segment !== WILDCARD_SINGLE
  })
}

export const validateKeyPattern = (pattern: string) => {
  if (!pattern) {
    return false
  }
  const segments = splitPath(pattern)
  if (!segments.length) {
    return false
  }
  return segments.every(segment => {
    if (!segment) {
      return false
    }
    if (RESERVED_KEYS.has(segment)) {
      return false
    }
    if (segment.includes('$')) {
      return false
    }
    if (segment === WILDCARD_SINGLE || segment === WILDCARD_MULTI) {
      return true
    }
    return true
  })
}

export const filterItemsByPermissions = (
  items: unknown,
  canReadPath: (path: string) => boolean,
  prefix = '',
): Record<string, unknown> | string | undefined => {
  if (typeof items === 'string') {
    if (!prefix) {
      return undefined
    }
    return canReadPath(prefix) ? items : undefined
  }

  if (!items || typeof items !== 'object' || Array.isArray(items)) {
    return undefined
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(items)) {
    const path = prefix ? `${prefix}.${key}` : key
    const filtered = filterItemsByPermissions(value, canReadPath, path)
    if (filtered === undefined) {
      continue
    }
    result[key] = filtered
  }

  if (!Object.keys(result).length) {
    return undefined
  }

  return result
}

export const sanitizeItemsInput = (
  items: unknown,
  pathPrefix = 'items',
): { sanitized: Record<string, unknown>; errors: string[] } => {
  const errors: string[] = []

  if (!items || typeof items !== 'object' || Array.isArray(items)) {
    return { sanitized: {}, errors }
  }

  const sanitizeObject = (
    obj: Record<string, unknown>,
    path: string,
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (
        !key ||
        key.includes('.') ||
        key.includes('$') ||
        RESERVED_KEYS.has(key)
      ) {
        errors.push(`Invalid key "${path}.${key}"`)
        continue
      }
      const nextPath = `${path}.${key}`
      if (typeof value === 'string') {
        result[key] = value
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeObject(value as Record<string, unknown>, nextPath)
      } else if (value === null || value === undefined) {
        result[key] = ''
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        result[key] = String(value)
      } else {
        errors.push(`Invalid value at "${nextPath}"`)
      }
    }
    return result
  }

  return {
    sanitized: sanitizeObject(items as Record<string, unknown>, pathPrefix),
    errors,
  }
}
