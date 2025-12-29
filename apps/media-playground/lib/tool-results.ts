import { TaskV2Result } from '@edenlabs/eden-sdk'

/**
 * Normalizes tool call results to always be an array.
 * The API might return a single object for some tools (like 'display'),
 * but our UI expects results to always be TaskV2Result[].
 */
export const normalizeToolResults = (result: unknown): TaskV2Result[] => {
  if (Array.isArray(result)) return result
  if (result) return [result as TaskV2Result]
  return []
}

/**
 * Checks if tool call has displayable results (media or text output).
 */
export const hasDisplayableResults = (result: unknown): boolean => {
  const results = normalizeToolResults(result)
  return (
    results.length > 0 &&
    results.some(
      r =>
        r &&
        (Array.isArray(r?.output) ||
          (typeof r?.output === 'string' && (r?.output as string).length > 0)),
    )
  )
}

/**
 * Checks if tool call results contain creations.
 */
export const hasCreationResults = (result: unknown): boolean => {
  const results = normalizeToolResults(result)
  return (
    results.length > 0 &&
    results.some(
      r =>
        r &&
        Array.isArray(r?.output) &&
        r.output.some(output => output.creation),
    )
  )
}
