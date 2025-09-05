'use client'

import { TriggerItem } from './trigger-item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trigger } from '@edenlabs/eden-sdk'

export type TriggerListProps = {
  triggers: Trigger[]
  agentId: string
}

export function TriggerList({ triggers, agentId }: TriggerListProps) {
  if (triggers.length === 0) {
    return (
      <div className="text-sm text-center text-muted-foreground py-4 border rounded-md">
        No tasks scheduled yet.
      </div>
    )
  }

  // Sort triggers by next_scheduled_run (most recent/earliest first)
  const sortedTriggers = [...triggers].sort((a, b) => {
    // If neither has next_scheduled_run, maintain original order
    if (!a.next_scheduled_run && !b.next_scheduled_run) return 0
    // If only a has no next_scheduled_run, put it last
    if (!a.next_scheduled_run) return 1
    // If only b has no next_scheduled_run, put it last
    if (!b.next_scheduled_run) return -1

    // Both have next_scheduled_run, sort by earliest first (ascending)
    const aTime = new Date(a.next_scheduled_run).getTime()
    const bTime = new Date(b.next_scheduled_run).getTime()
    return aTime - bTime
  })

  return (
    <ScrollArea className="-mx-4 px-4 flex flex-col max-h-[600px]">
      <div className="grid gap-3">
        {sortedTriggers.map(trigger => (
          <TriggerItem key={trigger._id} trigger={trigger} agentId={agentId} />
        ))}
      </div>
    </ScrollArea>
  )
}
