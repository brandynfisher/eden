'use client'

import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import Timeline from '@/components/timeline/timeline'
import { Button } from '@/components/ui/button'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ToolSelectorModal from '@/features/tools/tool-selector-modal'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { SparklesIcon } from 'lucide-react'
import { Suspense, useCallback, useState } from 'react'

const PLACEHOLDER_TOOL: Pick<ToolV2, 'key' | 'output_type'> = {
  key: 'create-landing',
  output_type: 'image',
}

const CreateLanding = () => {
  const [isToolSelectorOpen, setIsToolSelectorOpen] = useState(false)
  const openSelector = useCallback(() => setIsToolSelectorOpen(true), [])

  return (
    <>
      <div className="flex flex-col lg:flex-row w-full h-full flex-1 min-h-0">
        {/* Timeline column */}
        <div className="order-1 lg:order-2 px-2 sm:px-4 lg:px-2 lg:pt-4 flex flex-col gap-y-4 flex-1 min-h-0 overflow-y-auto pb-24 lg:pb-6">
          <div className="sticky top-0 lg:-top-4 z-10 flex flex-wrap items-center justify-between gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40 pb-2">
            <p className="text-base font-semibold leading-tight md:text-lg">
              Your Creations
            </p>
            <ErrorBoundary>
              <TaskStatusIndicator />
            </ErrorBoundary>
          </div>
          <Suspense>
            <ErrorBoundary>
              <Timeline tool={PLACEHOLDER_TOOL} subscribeToAll />
            </ErrorBoundary>
          </Suspense>
        </div>

        {/* Call-to-action panel - desktop only */}
        <div className="hidden lg:flex order-2 lg:order-1 lg:pr-2 min-w-[324px] w-full lg:w-[420px] flex-col justify-start items-start lg:self-start lg:h-full">
          <div className="bg-muted-darker rounded-md h-full w-full border border-secondary flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-2 bg-secondary border border-b-gray-300 dark:border-b-gray-700">
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <TypographyH4 className="text-sm lg:text-base">
                    Pick a tool to start creating
                  </TypographyH4>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Choose image, video, audio, or model workflows to load
                  creation settings.
                </div>
              </div>
            </div>
            <div className="px-3 pb-3 pt-3 border-b border-secondary bg-muted-darker">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="hidden w-full justify-center bg-primary/15 text-primary-foreground border border-primary/40 hover:bg-primary/25 lg:flex"
                onClick={openSelector}
              >
                Select a tool
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center gap-3">
              <div className="rounded-full bg-primary/10 text-primary-foreground h-14 w-14 flex items-center justify-center">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <p className="text-sm text-foreground">
                Select a tool to get started.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ToolSelectorModal
        currentTool={null}
        open={isToolSelectorOpen}
        onOpenChange={setIsToolSelectorOpen}
      />
      <div className="fixed left-0 bottom-0 w-full p-3 bg-background/95 border-t border-border shadow-lg lg:hidden">
        <Button
          onClick={openSelector}
          className="w-full max-w-md h-12 text-base mx-auto"
        >
          Select a tool
        </Button>
      </div>
    </>
  )
}

export default CreateLanding
