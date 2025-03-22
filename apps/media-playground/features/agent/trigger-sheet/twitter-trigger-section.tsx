'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { TriggerCollapsibleTrigger } from '@/features/agent/trigger-sheet/trigger-collapsible-trigger'
import { TriggerDialog } from '@/features/agent/trigger-sheet/trigger-dialog'
import { TriggerList } from '@/features/agent/trigger-sheet/trigger-list'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { useState } from 'react'

// Example triggers data - would be fetched from API in a real implementation
const dummyTriggers = [
  {
    id: '1',
    message: 'Post daily market insights and stock analysis',
    schedule: {
      hour: 9,
      minute: 30,
      day_of_week: '1-5', // Weekdays
      start_date: new Date(),
    },
    // For Twitter, we keep an empty channels array as channels are not used
    channels: [],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)),
  },
  {
    id: '2',
    message: 'Schedule weekly thread on tech trends and innovations',
    schedule: {
      hour: 17,
      minute: 0,
      day_of_week: '3', // Wednesday
      start_date: new Date(),
    },
    channels: [],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
  },
  {
    id: '3',
    message:
      'Monthly analytics report with growth metrics and engagement statistics',
    schedule: {
      hour: 12,
      minute: 0,
      day: 1, // First day of month
      start_date: new Date(),
    },
    channels: [],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 20)),
  },
]

type TwitterTriggerSectionProps = {
  agentId: string
  deployment?: Deployment
}

export const TwitterTriggerSection = ({
  agentId,
  deployment,
}: TwitterTriggerSectionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasDeployment = !!deployment

  // For Twitter, we pass an empty array since we don't use channels
  const channelOptions: { value: string; label: string }[] = []

  // For a real implementation, this would make an API call to delete a trigger
  const handleDeleteTrigger = (triggerId: string) => {
    console.log(`Delete Twitter trigger with ID: ${triggerId}`)
  }

  return (
    <Collapsible
      className="w-full"
      open={isOpen && hasDeployment}
      onOpenChange={hasDeployment ? setIsOpen : undefined}
      disabled={!hasDeployment}
    >
      <TriggerCollapsibleTrigger
        isOpen={isOpen}
        label="Twitter"
        tooltip="Create a trigger for Twitter"
        disabled={!hasDeployment}
        disabledNote="Deploy your agent on Twitter to configure triggers"
      />
      {hasDeployment && (
        <CollapsibleContent
          className={cn([
            isOpen
              ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
              : '',
          ])}
        >
          <div className="flex flex-col gap-3 p-4">
            <TriggerList
              triggers={dummyTriggers}
              channels={channelOptions}
              agentId={agentId}
              platform="twitter"
              onDelete={handleDeleteTrigger}
              emptyMessage="No Twitter triggers configured yet"
              hideChannels={true}
            />

            <div className="h-px bg-border my-1" />

            <TriggerDialog
              channels={channelOptions}
              agentId={agentId}
              platform="twitter"
              hideChannels={true}
            />
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
