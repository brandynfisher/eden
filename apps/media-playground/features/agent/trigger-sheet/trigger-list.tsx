'use client'

import { TriggerItem } from './trigger-item'
import { ScrollArea } from '@/components/ui/scroll-area'

type Channel = {
  value: string
  label: string
}

type TriggerData = {
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

export type TriggerListProps = {
  triggers: TriggerData[]
  channels: Channel[]
  agentId: string
  platform: string
  onDelete?: (triggerId: string) => void
  emptyMessage?: string
  hideChannels?: boolean
}

export function TriggerList({
  triggers,
  channels,
  agentId,
  platform,
  onDelete,
  emptyMessage = 'No triggers configured yet',
  hideChannels = false,
}: TriggerListProps) {
  // Filter out triggers with end dates that have already passed
  const filteredTriggers = triggers.filter(trigger => {
    // If there's no end date, always show the trigger
    if (!trigger.schedule.end_date) return true

    // Compare the end date with the current date
    const endDate = new Date(trigger.schedule.end_date)
    const currentDate = new Date()

    // Keep the trigger if the end date is in the future
    return endDate > currentDate
  })

  if (filteredTriggers.length === 0) {
    return (
      <div className="text-sm text-center text-muted-foreground py-4 border rounded-md">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ScrollArea className="pr-4 flex flex-col max-h-[400px] overflow-y-auto">
      <div className="grid gap-3">
        {filteredTriggers.map(trigger => (
          <TriggerItem
            key={trigger.id}
            trigger={trigger}
            channels={channels}
            agentId={agentId}
            platform={platform}
            onDelete={onDelete}
            hideChannels={hideChannels}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
