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
  ComponentIcon,
  TriangleAlertIcon,
  WrenchIcon, // HourglassIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { Suspense, useState } from 'react'

export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  args,
  result,
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
      ? args
      : subtoolCalls[selectedArgsIndex - 1]?.args || {}
  const currentToolName =
    selectedArgsIndex === 0
      ? toolName
      : subtoolCalls[selectedArgsIndex - 1]?.tool || toolName

  // Don't render cancelled tool calls
  if (toolStatus === 'cancelled') {
    return null
  }
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
          </div>
          {/* {toolStatus === null || toolStatus === TaskV2Status.Pending ? (
            <HourglassIcon className="text-gray-500 h-4 w-4 animate-pulse" />
          ) : null} */}
          {toolStatus === null ||
          toolStatus === TaskV2Status.Pending ||
          toolStatus === TaskV2Status.Running ? (
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
        </div>
        <div className="flex-grow" />
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
                className="flex flex-row gap-2 justify-start"
              >
                <ToggleGroupItem value="0" variant="outline" size="sm">
                  {toolName}
                </ToggleGroupItem>
                {subtoolCalls.map((subtool, index) => (
                  <ToggleGroupItem
                    key={index}
                    value={(index + 1).toString()}
                    variant="outline"
                    size="sm"
                  >
                    {subtool.tool}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
          {currentArgs.lora ? (
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={currentArgs.lora} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/${currentToolName}?lora=${currentArgs.lora}`}
                    className="ml-auto mr-2"
                    scroll={false}
                    shallow={true}
                  >
                    <ComponentIcon className="mr-2 h-4 w-4" />
                    Use
                  </Link>
                </Button>
              </ModelMiniCard>
            </Suspense>
          ) : null}
          {currentArgs.lora2 ? (
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={currentArgs.lora2} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/${currentToolName}?lora2=${currentArgs.lora2}`}
                    className="ml-auto mr-2"
                    scroll={false}
                    shallow={true}
                  >
                    <ComponentIcon className="mr-2 h-4 w-4" />
                    Use
                  </Link>
                </Button>
              </ModelMiniCard>
            </Suspense>
          ) : null}
          <ParameterTable
            // cost={currentArgs.cost}
            args={currentArgs}
            hideHeader={true}
            className="w-auto"
          />
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
