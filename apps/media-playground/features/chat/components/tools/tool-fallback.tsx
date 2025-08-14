'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import ModelMiniCard from '@/components/card/model-mini-card'
import LoadingIndicator from '@/components/loading-indicator'
import TextClampMore from '@/components/text/text-clamp-more'
import ParameterTable from '@/components/timeline/parameter-table'
import { AlertDescription } from '@/components/ui/alert'
import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TaskResultToolArgs } from '@/features/chat/components/tools/task-result-tool'
import { cn } from '@/lib/utils'
import { ToolCallContentPartComponent } from '@assistant-ui/react'
import { TaskV2Status } from '@edenlabs/eden-sdk'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CircleCheckIcon,
  TriangleAlertIcon,
  WrenchIcon,
  XIcon, // HourglassIcon,
} from 'lucide-react'
import React, { Suspense, useState } from 'react'

interface ToolFallbackProps
  extends React.ComponentProps<ToolCallContentPartComponent> {
  onCancel?: () => void
}

export const ToolFallback: React.FC<ToolFallbackProps> = ({
  toolName,
  args,
  result,
  onCancel,
}) => {
  const {
    status: toolStatus,
    error: toolError,
    result: toolResults,
  } = result as TaskResultToolArgs
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [selectedArgsIndex, setSelectedArgsIndex] = useState<number>(0) // 0 = main args, 1+ = subtool indices

  // Extract subtool_calls from the first result if they exist
  const subtoolCalls = toolResults?.[0]?.subtool_calls || []
  const hasSubtools = subtoolCalls.length > 0

  // Determine current args and tool name to display
  const currentArgs =
    selectedArgsIndex === 0
      ? args || {}
      : subtoolCalls[selectedArgsIndex - 1]?.args || {}

  // Filter out lora/lora2 from args if they exist (since we show them as ModelMiniCards)
  const filteredArgs = { ...currentArgs }
  if (currentArgs.lora) delete filteredArgs.lora
  if (currentArgs.lora2) delete filteredArgs.lora2

  return (
    <div className="mt-2 mb-2 flex w-full flex-col">
      <div
        className={cn([
          'bg-muted-darker cursor-pointer py-2 flex items-center gap-2 px-4 rounded-md border',
          !isCollapsed ? 'rounded-b-none' : '',
        ])}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <WrenchIcon className="size-4" />
        <div className="flex items-center gap-2">
          <div>
            <span className="font-bold">{toolName}</span>
            {toolStatus === 'cancelled' && (
              <span className="ml-2 text-orange-500 text-sm">(Cancelled)</span>
            )}
          </div>
          {/* {toolStatus === null || toolStatus === TaskV2Status.Pending ? (
            <HourglassIcon className="text-gray-500 h-4 w-4 animate-pulse" />
          ) : null} */}
          {(toolStatus === null ||
            toolStatus === TaskV2Status.Pending ||
            toolStatus === TaskV2Status.Running) &&
          (toolStatus as string) !== 'cancelled' ? (
            <span
              className={'text-blue-500 mr-1 h-5 w-5 loading loading-ring'}
            />
          ) : null}
          {toolStatus === TaskV2Status.Failed ? (
            <TriangleAlertIcon className="text-red-500 h-5 w-5" />
          ) : null}
          {toolStatus === TaskV2Status.Completed ? (
            <CircleCheckIcon className="text-green-500 h-5 w-5" />
          ) : null}
          {toolStatus === 'cancelled' ? (
            <XIcon className="text-orange-500 h-5 w-5" />
          ) : null}
        </div>
        <div className="flex-grow" />
        {(toolStatus === TaskV2Status.Running ||
          toolStatus === TaskV2Status.Pending) &&
          (toolStatus as string) !== 'cancelled' &&
          onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation()
                onCancel()
              }}
              className="mr-2 h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        <TooltipIconButton tooltip={isCollapsed ? 'Expand' : 'Collapse'}>
          {!isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </TooltipIconButton>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-2 py-2 border border-t-0 rounded-md rounded-tr-none rounded-tl-none bg-popover/30">
          {hasSubtools && (
            <div className="px-4 py-2 border-b border-border/20">
              <ToggleGroup
                type="single"
                value={selectedArgsIndex.toString()}
                onValueChange={value => {
                  if (value) setSelectedArgsIndex(parseInt(value))
                }}
                className="flex flex-row items-center gap-2 justify-start"
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
          <ParameterTable
            // cost={filteredArgs.cost}
            args={filteredArgs}
            hideHeader={true}
            className="w-auto"
          />

          {(currentArgs.lora || currentArgs.lora2) && (
            <div className="mt-4">
              <div className="text-sm font-medium text-muted-foreground mb-2 px-1">
                {currentArgs.lora && currentArgs.lora2 ? 'Loras' : 'Lora'}
              </div>
              {currentArgs.lora ? (
                <Suspense fallback={<LoadingIndicator />}>
                  <ModelMiniCard
                    modelId={currentArgs.lora}
                    className="bg-popover mb-2"
                  />
                </Suspense>
              ) : null}
              {currentArgs.lora2 ? (
                <Suspense fallback={<LoadingIndicator />}>
                  <ModelMiniCard
                    modelId={currentArgs.lora2}
                    className="bg-popover"
                  />
                </Suspense>
              ) : null}
            </div>
          )}
        </div>
      )}
      {toolStatus === TaskV2Status.Failed ? (
        <div className="mt-2">
          <AlertDestructive title="Tool Call failed">
            <AlertDescription>
              <TextClampMore text={toolError || 'Unknown Error'} lines={3} />
            </AlertDescription>
          </AlertDestructive>
        </div>
      ) : null}
    </div>
  )
}
