'use client'

import { TriggerItem } from './trigger-item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trigger } from '@edenlabs/eden-sdk'

export type TriggerListProps = {
  triggers: Trigger[]
  agentId: string
}

export function TriggerList({ triggers, agentId }: TriggerListProps) {
  const filteredTriggers = triggers.filter(trigger => {
    if (!trigger.schedule.end_date) return true

    const endDate = new Date(trigger.schedule.end_date)
    const currentDate = new Date()

    return endDate > currentDate
  })

  if (filteredTriggers.length === 0) {
    return (
      <div className="text-sm text-center text-muted-foreground py-4 border rounded-md">
        No tasks scheduled yet
      </div>
    )
  }

  return (
    <ScrollArea className="-mx-4 px-4 flex flex-col max-h-[600px]">
      <div className="grid gap-3">
        {filteredTriggers.map(trigger => (
          <TriggerItem key={trigger._id} trigger={trigger} agentId={agentId} />
        ))}
      </div>
    </ScrollArea>
  )
}
