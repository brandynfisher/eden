'use client'

import { TriggerDialog } from './trigger-dialog'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { format } from 'date-fns'
import { Edit2Icon, TrashIcon } from 'lucide-react'
import { useState } from 'react'

export type TriggerItemProps = {
  trigger: {
    id: string
    message: string
    schedule: {
      year?: number | string
      month?: number | string
      day?: number | string
      week?: number | string
      day_of_week?: number | string | string[]
      hour?: number | string
      minute?: number | string
      second?: number | string
      start_date: Date
      end_date?: Date
      timezone?: string
    }
    channels: { id: string; name: string }[]
    createdAt?: Date
  }
  channels: { value: string; label: string }[]
  agentId: string
  platform: string
  onDelete?: (triggerId: string) => void
  hideChannels?: boolean
}

export const TriggerItem = ({
  trigger,
  channels,
  agentId,
  platform,
  onDelete,
  hideChannels = false,
}: TriggerItemProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPopover, setShowPopover] = useState(false)

  const formatInstructions = (instructions: string, maxLength = 30) => {
    if (instructions.length <= maxLength) return instructions
    return `${instructions.substring(0, maxLength)}...`
  }

  // Get formatted cron schedule
  const formattedSchedule = formatCronSchedule(trigger.schedule)

  const handleDelete = () => {
    if (onDelete) {
      onDelete(trigger.id)
    }
  }

  return (
    <>
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <div className="p-3 rounded-md border border-border hover:bg-accent/50 relative group cursor-pointer">
            <div className="absolute right-2 top-2 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={e => {
                  e.stopPropagation()
                  setShowEditDialog(true)
                }}
              >
                <Edit2Icon className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={e => {
                  e.stopPropagation()
                  handleDelete()
                }}
              >
                <TrashIcon className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
            <div>
              <p className="font-medium text-sm line-clamp-1">
                {formatInstructions(trigger.message)}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span className="line-clamp-1 max-w-[70%]">
                  {formattedSchedule}
                </span>
                {!hideChannels && (
                  <span>
                    {trigger.channels.length}{' '}
                    {trigger.channels.length === 1 ? 'channel' : 'channels'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-4"
          align="start"
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold">Instructions</h4>
              <p className="text-sm text-muted-foreground">{trigger.message}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Schedule</h4>
              <p className="text-sm text-muted-foreground">
                {formattedSchedule}
              </p>
            </div>
            {!hideChannels && (
              <div>
                <h4 className="text-sm font-semibold">Channels</h4>
                <div className="text-sm text-muted-foreground">
                  {trigger.channels.map(channel => (
                    <div key={channel.id}>{channel.name}</div>
                  ))}
                </div>
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
        </PopoverContent>
      </Popover>

      <TriggerDialog
        mode="edit"
        trigger={trigger}
        channels={channels}
        agentId={agentId}
        platform={platform}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        hideChannels={hideChannels}
      />
    </>
  )
}
