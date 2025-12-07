'use client'

import ErrorBoundary from '@/components/error-boundary'
import Timeline from '@/components/timeline/timeline'
import { Skeleton } from '@/components/ui/skeleton'
import CreationUiContainer from '@/features/tools/creation-ui-container'
import { useToolQuery } from '@/hooks/query/use-tool-query'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'

type Props = {
  toolKey: ToolV2['key']
  toolSSRData?: ToolV2
}

const Workspace = ({ toolKey, toolSSRData }: Props) => {
  // 🔑 Every time ?creation= or ?task= changes, we want a fresh form
  const searchParams = useSearchParams()
  const [presetKey, setPresetKey] = useState<string>(() => {
    return (
      searchParams?.get('creation') ??
      searchParams?.get('task') ??
      searchParams?.get('lora') ??
      'default'
    )
  })

  // Lock in the preset key on first mount only — don’t update reactively
  const hasLockedKey = useRef(false)
  useEffect(() => {
    if (!hasLockedKey.current) {
      const newKey =
        searchParams?.get('creation') ??
        searchParams?.get('task') ??
        searchParams?.get('lora') ??
        'default'
      setPresetKey(newKey)
      hasLockedKey.current = true
    }
  }, [searchParams])

  const { tool: toolClientData } = useToolQuery({
    key: toolKey,
    initialData: toolSSRData
      ? {
          tool: toolSSRData,
        }
      : undefined,
  })

  const tool = toolClientData || toolSSRData

  // Dynamically size the tool column to remaining viewport height on desktop only
  const toolColumnRef = useRef<HTMLDivElement>(null)
  const [toolColumnHeight, setToolColumnHeight] = useState<number>()
  const [isDesktop, setIsDesktop] = useState(false)

  useLayoutEffect(() => {
    const updateHeight = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)

      if (!desktop || !toolColumnRef.current) {
        setToolColumnHeight(undefined)
        return
      }

      const top = toolColumnRef.current.getBoundingClientRect().top
      const height = window.innerHeight - top
      setToolColumnHeight(height > 0 ? height : undefined)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    window.addEventListener('scroll', updateHeight, { passive: true })

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('scroll', updateHeight)
    }
  }, [])

  if (!tool) {
    return null
  }

  return (
    <div
      data-test-id="workspace"
      className="flex flex-col lg:flex-row w-full h-full flex-1 min-h-0"
    >
      {/* Timeline - always visible, full width on mobile */}
      <div className="order-1 lg:order-2 px-2 sm:px-4 lg:px-2 lg:pt-4 flex flex-col gap-y-4 flex-1 min-h-0 overflow-y-auto pb-6">
        <Suspense>
          <ErrorBoundary>
            <Timeline tool={tool} />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Tool form: CreationUiContainer renders desktop panel + mobile overlay */}
      <div
        ref={toolColumnRef}
        style={
          isDesktop && toolColumnHeight
            ? { height: toolColumnHeight, maxHeight: toolColumnHeight }
            : undefined
        }
        className="order-2 lg:order-1 lg:pr-2 min-w-[324px] w-full lg:w-[420px] flex flex-col min-h-0 lg:self-start lg:sticky lg:top-0 lg:overflow-hidden"
        data-test-id="workspace-tool-column"
      >
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <ErrorBoundary>
            <CreationUiContainer key={presetKey} tool={tool} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  )
}

export default Workspace
