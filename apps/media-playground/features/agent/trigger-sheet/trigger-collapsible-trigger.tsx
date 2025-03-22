import { CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, InfoIcon } from 'lucide-react'

interface TriggerCollapsibleTriggerProps {
  isOpen: boolean
  label: string
  tooltip: string
  disabled?: boolean
  disabledNote?: string
}

export const TriggerCollapsibleTrigger = ({
  isOpen,
  label,
  tooltip,
  disabled = false,
  disabledNote,
}: TriggerCollapsibleTriggerProps) => {
  if (disabled) {
    return (
      <div
        className={cn([
          'w-full flex items-center gap-4 p-4 border transition-colors rounded-lg',
          'border border-muted bg-popover',
          'opacity-70 cursor-not-allowed',
        ])}
      >
        <div className="w-full flex items-center gap-2">
          <Label>{label}</Label>
          <TooltipProvider delayDuration={125}>
            <Tooltip>
              <TooltipTrigger
                className="text-muted-foreground hover:text-accent-foreground cursor-pointer flex items-center"
                onClick={ev => ev.preventDefault()}
                asChild
              >
                <InfoIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent sideOffset={16} className="max-w-[95dvw]">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {disabledNote && (
            <span className="text-xs text-muted-foreground ml-auto">
              {disabledNote}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <CollapsibleTrigger
      className={cn([
        'w-full flex items-center gap-4 p-4 border transition-colors rounded-lg',
        isOpen
          ? 'bg-muted-foreground/10 border border-gray-400/20 rounded-b-none'
          : 'border border-muted bg-popover',
      ])}
    >
      <div className="flex items-center gap-2">
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 mr-2 transition',
            isOpen ? 'rotate-[-180deg]' : '',
          )}
        />
        <Label className="cursor-pointer">{label}</Label>
        <TooltipProvider delayDuration={125}>
          <Tooltip>
            <TooltipTrigger
              className="text-muted-foreground hover:text-accent-foreground cursor-pointer flex items-center"
              onClick={ev => ev.preventDefault()}
              asChild
            >
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent sideOffset={16} className="max-w-[95dvw]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CollapsibleTrigger>
  )
}
