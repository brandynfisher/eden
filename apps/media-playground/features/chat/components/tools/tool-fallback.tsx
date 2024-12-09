import ParameterTable from '@/components/timeline/parameter-table'
import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { cn } from '@/lib/utils'
import { ToolCallContentPartComponent } from '@assistant-ui/react'
import { ChevronDownIcon, ChevronUpIcon, WrenchIcon } from 'lucide-react'
import { useState } from 'react'

export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  args,
  // result,
}) => {
  delete args.seed

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
          Tool: <span className="font-bold">{toolName}</span>
        </p>
        <div className="flex-grow" />
        <TooltipIconButton tooltip={isCollapsed ? 'Expand' : 'Collapse'}>
          {!isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </TooltipIconButton>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col gap-2 py-2 border border-t-0 rounded-md rounded-tr-none rounded-tl-none">
          <ParameterTable args={args} hideHeader={true} />
          {/*{result !== undefined && (*/}
          {/*  <div className="border-t border-dashed px-4 pt-2">*/}
          {/*    <p className="font-semibold">Result:</p>*/}
          {/*    <pre className="text-sm whitespace-pre-wrap">*/}
          {/*      {typeof result === 'string'*/}
          {/*        ? result*/}
          {/*        : JSON.stringify(result, null, 2)}*/}
          {/*    </pre>*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      )}
    </div>
  )
}
