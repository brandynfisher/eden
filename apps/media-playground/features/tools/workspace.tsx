'use client'

import ErrorBoundary from '@/components/error-boundary'
import Timeline from '@/components/timeline/timeline'
import { Skeleton } from '@/components/ui/skeleton'
import CreationUiContainer from '@/features/tools/creation-ui-container'
import { useToolQuery } from '@/hooks/query/use-tool-query'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type Props = {
  toolKey: ToolV2['key']
  toolSSRData?: ToolV2
}

const Workspace = ({ toolKey, toolSSRData }: Props) => {
  // 🔑 Every time ?creation= or ?task= changes, we want a fresh form
  const searchParams = useSearchParams()
  const [presetKey] = useState(() => {
    return (
      searchParams.get('creation') ??
      searchParams.get('task') ??
      searchParams.get('lora') ??
      'default'
    )
  })

  const { tool: toolClientData } = useToolQuery({
    key: toolKey,
    initialData: toolSSRData
      ? {
          tool: toolSSRData,
        }
      : undefined,
  })

  const [showFormInline, setShowFormInline] = useState(true)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const showInline = width >= 1024 // show inline form on desktop only

      setShowFormInline(showInline)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const tool = toolClientData || toolSSRData

  if (!tool) {
    return null
  }

  return (
    <div
      data-test-id="workspace"
      className="flex flex-col lg:flex-row lg:items-start w-full h-[calc(100vh-theme(spacing.16))]"
    >
      {/* Tool Form: always rendered */}
      <div
        className={`lg:pr-2 min-w-[324px] w-full lg:w-[420px] flex flex-col justify-start items-start lg:self-start h-[calc(100vh-theme(spacing.16))] ${
          showFormInline ? 'block' : 'hidden'
        }`}
      >
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <ErrorBoundary>
            <CreationUiContainer key={presetKey} tool={tool} />
          </ErrorBoundary>
        </Suspense>
      </div>

      {/* Timeline - right pane always visible */}
      <div className="mb-8 px-2 sm:px-4 lg:px-2 lg:pt-4 flex flex-col gap-y-4 flex-1 h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
        <Suspense>
          <ErrorBoundary>
            <Timeline tool={tool} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  )
}

export default Workspace
