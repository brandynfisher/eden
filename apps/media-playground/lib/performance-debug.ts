/**
 * Performance debugging utilities
 * Add these to suspect components to track re-renders and performance issues
 */
import { useEffect, useRef } from 'react'

/**
 * Log when a component renders and why
 * Usage: useWhyDidYouUpdate('ComponentName', { prop1, prop2, state1 })
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, unknown>,
) {
  const previousProps = useRef<Record<string, unknown>>()

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps: Record<string, { from: unknown; to: unknown }> = {}

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          }
        }
      })

      if (Object.keys(changedProps).length > 0) {
        // eslint-disable-next-line no-console
        console.log('[why-did-you-update]', name, changedProps)
      }
    }

    previousProps.current = props
  })
}

/**
 * Track render count
 * Usage: const renderCount = useRenderCount('ComponentName')
 */
export function useRenderCount(componentName: string) {
  const renders = useRef(0)

  useEffect(() => {
    renders.current += 1
    // eslint-disable-next-line no-console
    console.log(`[render-count] ${componentName}: ${renders.current}`)
  })

  return renders.current
}

/**
 * Measure component render time
 * Usage: useRenderTime('ComponentName')
 */
export function useRenderTime(componentName: string) {
  const renderStart = useRef(performance.now())

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current
    if (renderTime > 16) {
      // Log if render took longer than one frame (16ms)
      // eslint-disable-next-line no-console
      console.warn(
        `[slow-render] ${componentName} took ${renderTime.toFixed(2)}ms`,
      )
    }
    renderStart.current = performance.now()
  })
}

/**
 * Detect memory leaks from event listeners or intervals
 * Call this in useEffect cleanup
 */
export function detectLeaks(componentName: string) {
  let isMounted = true

  return {
    checkMount: () => {
      if (!isMounted) {
        // eslint-disable-next-line no-console
        console.error(
          `[memory-leak] ${componentName} is trying to update after unmount`,
        )
      }
      return isMounted
    },
    cleanup: () => {
      isMounted = false
    },
  }
}

/**
 * Monitor infinite loops or excessive updates
 * Usage: useUpdateThrottle('ComponentName', dependency)
 */
export function useUpdateThrottle(
  componentName: string,
  dependency: unknown,
  maxUpdatesPerSecond = 10,
) {
  const updateTimes = useRef<number[]>([])

  useEffect(() => {
    const now = Date.now()
    updateTimes.current.push(now)

    // Keep only updates from the last second
    updateTimes.current = updateTimes.current.filter(time => now - time < 1000)

    if (updateTimes.current.length > maxUpdatesPerSecond) {
      // eslint-disable-next-line no-console
      console.error(
        `[excessive-updates] ${componentName} updated ${updateTimes.current.length} times in 1 second!`,
        'Dependency:',
        dependency,
      )
    }
  }, [dependency, componentName, maxUpdatesPerSecond])
}
