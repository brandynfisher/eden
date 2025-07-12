'use client'

import LoadingIndicator from '@/components/loading-indicator'
import ParameterTable from '@/components/timeline/parameter-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, WrenchIcon } from 'lucide-react'
import { Suspense, useState } from 'react'

type Props = {
  toolName: string
  args: Record<string, unknown>
  className?: string
}

export const ToolHoverMenu = ({ toolName, args, className }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

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
          <Suspense fallback={<LoadingIndicator />}>
            <ParameterTable args={args} hideHeader={true} className="w-auto" />
          </Suspense>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
