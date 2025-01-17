'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import ModelMiniCard from '@/components/card/model-mini-card'
import LoadingIndicator from '@/components/loading-indicator'
import TextClampMore from '@/components/text/text-clamp-more'
import ParameterTable from '@/components/timeline/parameter-table'
import { AlertDescription } from '@/components/ui/alert'
import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { Button } from '@/components/ui/button'
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
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { Suspense, useState } from 'react'

export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  args,
  result,
}) => {
  delete args.seed
  const { status: toolStatus, error: toolError } = result as TaskResultToolArgs

  const [isCollapsed, setIsCollapsed] = useState(true)
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
          {toolStatus === null ||
          toolStatus === TaskV2Status.Running ||
          toolStatus === TaskV2Status.Pending ? (
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
          {args.lora ? (
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={args.lora} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/${toolName}?lora=${args.lora}`}
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
          {args.lora2 ? (
            <Suspense fallback={<LoadingIndicator />}>
              <ModelMiniCard modelId={args.lora2} className="bg-popover">
                <Button size="sm" variant="outline" asChild>
                  <Link
                    href={`/create/image/${toolName}?lora2=${args.lora2}`}
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
          <ParameterTable args={args} hideHeader={true} />
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
