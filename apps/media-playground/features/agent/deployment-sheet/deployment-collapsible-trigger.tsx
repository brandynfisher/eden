import { Badge } from '@/components/ui/badge'
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

interface DeploymentCollapsibleTriggerProps {
  isOpen: boolean
  isDeployed: boolean
  label: string
  tooltip: string
  valid?: boolean
}

export const DeploymentCollapsibleTrigger = ({
  isOpen,
  isDeployed,
  label,
  tooltip,
  valid,
}: DeploymentCollapsibleTriggerProps) => {
  return (
    <CollapsibleTrigger
      className={cn([
        'w-full flex items-center gap-4 p-4 border transition-colors rounded-lg',
        isOpen
          ? 'bg-muted-foreground/10 border border-gray-400/20 rounded-b-none'
          : 'border border-muted bg-popover',
        isDeployed ? 'border-success' : '',
        valid === false ? 'border-destructive' : '',
      ])}
    >
      <div className="flex items-center gap-2">
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 mr-2 transition',
            isOpen ? 'rotate-[-180deg]' : '',
          )}
        />
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
      </div>

      {isDeployed && (
        <Badge
          variant="outline"
          className={cn(
            'bg-success/20 text-success-foreground border-success',
            valid === false
              ? 'bg-destructive/20 text-destructive-foreground border-destructive'
              : '',
          )}
        >
          {valid === false ? 'Failed' : 'Deployed'}
        </Badge>
      )}
    </CollapsibleTrigger>
  )
}
