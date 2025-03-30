'use client'

import DiscordIcon from '@/components/icons/discord'
import { TelegramIcon } from '@/components/icons/telegram'
import TwitterIcon from '@/components/icons/twitter'
import TextClampMore from '@/components/text/text-clamp-more'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { cn } from '@/lib/utils'
import { Trigger } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { format } from 'date-fns'
import { ChevronDownIcon, TrashIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export type TriggerItemProps = {
  agentId: string
  trigger: Trigger
}

export const TriggerItem = ({ agentId, trigger }: TriggerItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { invalidate } = useAgentTriggersQuery({
    key: agentId,
    enabled: false,
  })

  const formattedSchedule = formatCronSchedule(trigger.schedule)

  const channel = useMemo(() => {
    return trigger.channel?.note || trigger.channel?.id
  }, [trigger])

  const handleDelete = async () => {
    const deletePromise = async () => {
      setIsDeleting(true)
      try {
        await axios.delete(`/api/agents/${agentId}/triggers/${trigger._id}`)
        await invalidate()
      } catch (error) {
        throw new Error('Failed to delete task')
      } finally {
        setIsDeleting(false)
      }
    }

    toast.promise(deletePromise, {
      loading: 'Deleting task...',
      success: 'Task deleted successfully',
      error: 'Failed to delete task',
      richColors: true,
    })
  }

  const getPlatformBadgeClass = (platform: string) => {
    switch (platform) {
      case 'discord':
        return 'bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-white'
      case 'telegram':
        return 'bg-sky-500/20 hover:bg-sky-500/30 text-white'
      case 'twitter':
        return 'bg-blue-500/20 hover:bg-blue-500/30 text-white'
      default:
        return 'bg-secondary'
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn([
          'w-full flex flex-col gap-2 p-4 border transition-colors rounded-lg',
          isOpen
            ? 'bg-muted-foreground/10 border border-gray-400/20 rounded-b-none'
            : 'border border-muted bg-popover hover:bg-accent/50',
        ])}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge
            className={cn(
              'w-fit text-xs border-transparent capitalize gap-1 cursor-default',
              getPlatformBadgeClass(trigger.platform),
            )}
          >
            {trigger.platform === 'discord' && <DiscordIcon size={16} />}
            {trigger.platform === 'telegram' && <TelegramIcon size={16} />}
            {trigger.platform === 'twitter' && <TwitterIcon size={16} />}
            {trigger.platform}
          </Badge>
          <div className="flex items-center gap-2">
            <ChevronDownIcon
              className={cn(
                'w-4 h-4 transition',
                isOpen ? 'rotate-[-180deg]' : '',
              )}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
              onClick={e => {
                e.stopPropagation()
                handleDelete()
              }}
            >
              <TrashIcon className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        <p className="font-medium text-sm line-clamp-2 flex-1 text-left">
          {trigger.message}
        </p>
        <span className="text-xs text-muted-foreground text-left">
          {formattedSchedule}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 py-3 border border-t-0 border-gray-400/20 rounded-b-lg">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <p className="text-sm text-muted-foreground">{trigger.platform}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Instructions</h4>
            <TextClampMore
              text={trigger.message}
              className="text-sm text-muted-foreground"
              lines={2}
            />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Schedule</h4>
            <p className="text-sm text-muted-foreground">{formattedSchedule}</p>
          </div>
          {channel && (
            <div>
              <h4 className="text-sm font-semibold">Channel</h4>
              <div className="text-sm text-muted-foreground">{channel}</div>
            </div>
          )}
          {trigger.createdAt && (
            <div>
              <h4 className="text-sm font-semibold">Created</h4>
              <p className="text-sm text-muted-foreground">
                {format(
                  new Date(trigger.createdAt),
                  "MMMM d, yyyy 'at' h:mm a",
                )}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
