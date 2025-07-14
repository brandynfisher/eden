'use client'

import ErrorBoundary from '@/components/error-boundary'
import Timeline from '@/components/timeline/timeline'
import { Skeleton } from '@/components/ui/skeleton'
import CreationUiContainer from '@/features/tools/creation-ui-container'
import { useToolQuery } from '@/hooks/query/use-tool-query'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

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

  if (!tool) {
    return null
  }

  return (
    <div
      data-test-id="workspace"
      className="flex flex-col lg:flex-row lg:items-start w-full h-[calc(100vh-theme(spacing.16))]"
    >
      {/* Tool Form: Only on desktop, creation-ui-container handles mobile as overlay */}
      <div className="hidden lg:flex lg:pr-2 min-w-[324px] w-full lg:w-[420px] flex-col justify-start items-start lg:self-start h-[calc(100vh-theme(spacing.16))]">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <ErrorBoundary>
            <CreationUiContainer key={presetKey} tool={tool} />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Timeline - always visible, full width on mobile */}
      <div className="mb-8 px-2 sm:px-4 lg:px-2 lg:pt-4 flex flex-col gap-y-4 flex-1 h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        <Suspense>
          <ErrorBoundary>
            <Timeline tool={tool} />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Mobile form (floating + overlay) - rendered separately for mobile */}
      <div className="lg:hidden">
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
