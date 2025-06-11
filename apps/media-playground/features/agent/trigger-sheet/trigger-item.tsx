'use client'

import TextClampMore from '@/components/text/text-clamp-more'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { cn } from '@/lib/utils'
import { Trigger } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { format } from 'date-fns'
import { ChevronDownIcon, CopyIcon, GlobeIcon, TrashIcon } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

export type TriggerItemProps = {
  agentId: string
  trigger: Trigger
}

export const TriggerItem = ({ agentId, trigger }: TriggerItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [, copy] = useCopyToClipboard()
  const { invalidate } = useAgentTriggersQuery({
    key: agentId,
    enabled: false,
  })

  const formattedSchedule = formatCronSchedule(trigger.schedule)

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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    copy(trigger.instruction)
      .then(() => {
        toast.info('Copied "Task Instruction"', {
          description:
            trigger.instruction && trigger.instruction.length > 120
              ? `${trigger.instruction.substring(0, 120)}...`
              : trigger.instruction,
          dismissible: true,
          richColors: true,
        })
      })
      .catch(error => {
        toast.error('Failed to copy!', {
          description: error,
          dismissible: true,
          richColors: true,
        })
      })
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
              'bg-blue-500/20 hover:bg-blue-500/30 text-white',
            )}
          >
            <GlobeIcon size={16} />
            Web
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
              asChild
              onClick={e => {
                e.stopPropagation()
                handleDelete()
              }}
            >
              <div>
                <TrashIcon className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </div>
            </Button>
          </div>
        </div>
        <div
          className="select-text cursor-text"
          onMouseDown={e => {
            // Allow text selection by preventing trigger click when selecting text
            e.stopPropagation()
          }}
          onClick={e => {
            // Prevent trigger click when clicking on text for selection
            e.stopPropagation()
          }}
        >
          <TextClampMore
            text={trigger.instruction}
            className="font-medium text-sm flex-1 text-left whitespace-pre-line"
            lines={2}
            renderActions={() => (
              <Button
                variant="link"
                size="sm"
                className="text-xs text-muted-foreground flex items-center cursor-pointer hover:text-accent-foreground h-5"
                onClick={handleCopy}
              >
                <CopyIcon className="mr-1 h-3 w-3" />
                Copy
              </Button>
            )}
          />
        </div>

        <span className="text-xs text-muted-foreground text-left">
          {formattedSchedule}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border border-t-0 border-gray-400/20 rounded-b-lg">
        <div className="space-y-3 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <p className="text-sm text-muted-foreground">Web</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Schedule</h4>
            <p className="text-sm text-muted-foreground">{formattedSchedule}</p>
          </div>
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
