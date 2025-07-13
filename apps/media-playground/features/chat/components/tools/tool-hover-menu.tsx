'use client'

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
      <DropdownMenuContent className="w-80 max-w-[90vw]" align="end">
        <div className="p-2">
          {/* SUBTOOL NAVIGATION */}
          {hasSubtools && (
            <div className="mb-3 p-2 border-b border-border/20">
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

          <Suspense fallback={<LoadingIndicator />}>
            <ParameterTable
              args={currentArgs}
              hideHeader={true}
              className="w-auto"
            />
          </Suspense>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
