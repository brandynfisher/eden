import ParameterTable from '@/components/timeline/parameter-table'
import { cn } from '@/lib/utils'
import { ToolCallContentPartComponent } from '@assistant-ui/react'
import { INTERNAL } from '@assistant-ui/react'
import { ChevronDownIcon, ChevronUpIcon, WrenchIcon } from 'lucide-react'
import { useState } from 'react'

const { TooltipIconButton } = INTERNAL

export const ToolFallback: ToolCallContentPartComponent = ({
  toolCallId,
  toolName,
  args,
  result,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  return (
    <div className="mt-1 mb-3 flex w-full flex-col">
      <div
        className={cn([
          'bg-muted-darker cursor-pointer py-2 flex items-center gap-2 px-4 rounded-md border',
          !isCollapsed ? 'rounded-b-none' : '',
        ])}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <WrenchIcon className="size-4" />
        <p>
          Used tool: <span className="font-bold">{toolName}</span>
        </p>
        <div className="flex-grow" />
        <TooltipIconButton tooltip={isCollapsed ? 'Expand' : 'Collapse'}>
          {!isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </TooltipIconButton>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col gap-2 py-2 border border-t-0 rounded-md rounded-tr-none rounded-tl-none">
          <ParameterTable taskId={toolCallId} args={args} />
          {result !== undefined && (
            <div className="border-t border-dashed px-4 pt-2">
              <p className="font-semibold">Result:</p>
              <pre className="text-sm whitespace-pre-wrap">
                {typeof result === 'string'
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
