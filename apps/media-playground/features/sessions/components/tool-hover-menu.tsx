'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import LoadingIndicator from '@/components/loading-indicator'
import ParameterTable from '@/components/timeline/parameter-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ChevronDownIcon, WrenchIcon } from 'lucide-react'
import { Suspense, useState } from 'react'

type Props = {
  toolName: string
  args: Record<string, unknown>
  className?: string
  result?: TaskV2Result[]
}

export const ToolHoverMenu = ({ toolName, args, className, result }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedArgsIndex, setSelectedArgsIndex] = useState<number>(0) // 0 = main args, 1+ = subtool indices

  // Extract subtool_calls from the first result if they exist
  const subtoolCalls = result?.[0]?.subtool_calls || []
  const hasSubtools = subtoolCalls.length > 0

  // Determine current args to display
  const currentArgs =
    selectedArgsIndex === 0
      ? args
      : subtoolCalls[selectedArgsIndex - 1]?.args || {}

  // Safely check if currentArgs is a valid object
  const safeCurrentArgs =
    currentArgs && typeof currentArgs === 'object' ? currentArgs : {}

  // Filter out lora/lora2 from args if they exist (since we show them as ModelMiniCards)
  const filteredArgs = { ...safeCurrentArgs }
  if (safeCurrentArgs.lora) delete filteredArgs.lora
  if (safeCurrentArgs.lora2) delete filteredArgs.lora2

  // Check if we have any args to display
  const hasArgsToDisplay = Object.keys(filteredArgs).length > 0

  // Don't render the dropdown at all if there are no args and no subtools
  const hasContentToShow = hasArgsToDisplay || hasSubtools

  if (!hasContentToShow) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn([
            'flex items-center gap-1 h-7 px-2 text-xs bg-background/80 backdrop-blur-sm',
            className,
          ])}
        >
          <WrenchIcon className="size-3" />
          <span className="font-medium">{toolName}</span>
          <ChevronDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[460px] max-w-[90vw] max-h-[60vh] md:max-h-[80vh]"
        align="end"
        sideOffset={5}
        forceMount
      >
        <div className="p-2 overflow-y-auto overscroll-contain max-h-[calc(60vh-1rem)] md:max-h-[calc(80vh-1rem)] -webkit-overflow-scrolling-touch">
          {/* SUBTOOL NAVIGATION */}
          {hasSubtools && (
            <div className="mb-3 p-2 border-b border-border/20">
              <ToggleGroup
                type="single"
                value={selectedArgsIndex.toString()}
                onValueChange={value => {
                  if (value) setSelectedArgsIndex(parseInt(value))
                }}
                className="flex flex-wrap items-center gap-2 justify-start"
              >
                <ToggleGroupItem
                  value="0"
                  variant="outline"
                  size="sm"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:bg-muted/30 data-[state=off]:text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  {toolName}
                </ToggleGroupItem>
                {subtoolCalls.length > 0 && (
                  <span className="text-muted-foreground text-xs px-1">→</span>
                )}
                {subtoolCalls.map((subtool, index) => (
                  <ToggleGroupItem
                    key={index}
                    value={(index + 1).toString()}
                    variant="outline"
                    size="sm"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=off]:bg-muted/30 data-[state=off]:text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    {subtool.tool}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {hasArgsToDisplay && (
            <Suspense fallback={<LoadingIndicator />}>
              <ParameterTable
                args={filteredArgs}
                hideHeader={true}
                className="w-auto"
              />
            </Suspense>
          )}

          {(safeCurrentArgs.lora || safeCurrentArgs.lora2) && (
            <div className="mt-4">
              <div className="text-sm font-medium text-muted-foreground mb-2 px-1">
                {safeCurrentArgs.lora && safeCurrentArgs.lora2
                  ? 'Loras'
                  : 'Lora'}
              </div>
              {safeCurrentArgs.lora ? (
                <Suspense fallback={<LoadingIndicator />}>
                  <ModelMiniCard
                    modelId={safeCurrentArgs.lora}
                    className="bg-popover mb-2"
                  />
                </Suspense>
              ) : null}
              {safeCurrentArgs.lora2 ? (
                <Suspense fallback={<LoadingIndicator />}>
                  <ModelMiniCard
                    modelId={safeCurrentArgs.lora2}
                    className="bg-popover"
                  />
                </Suspense>
              ) : null}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
