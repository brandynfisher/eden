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
    message: 'Send daily weather updates to subscribers',
    schedule: {
      hour: 8,
      minute: 0,
      start_date: new Date(),
    },
    channels: [{ id: 'weather-channel', name: 'Weather Updates' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
  },
  {
    id: '2',
    message: 'Send weekly news digest with top stories and trending topics',
    schedule: {
      hour: 12,
      minute: 0,
      day_of_week: '1', // Monday
      start_date: new Date(),
    },
    channels: [{ id: 'news-digest', name: 'News Digest' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 6)),
  },
  {
    id: '3',
    message: 'Monthly community survey and feedback collection',
    schedule: {
      hour: 10,
      minute: 0,
      day: 1, // First day of month
      start_date: new Date(),
    },
    channels: [{ id: 'community', name: 'Community Channel' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 22)),
  },
  {
    id: '4',
    message: 'Send weekend entertainment recommendations and events',
    schedule: {
      hour: 18,
      minute: 0,
      day_of_week: '5', // Friday
      start_date: new Date(),
    },
    channels: [{ id: 'entertainment', name: 'Entertainment' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)),
  },
]

type TelegramTriggerSectionProps = {
  agentId: string
  deployment?: Deployment
}

export const TelegramTriggerSection = ({
  agentId,
  deployment,
}: TelegramTriggerSectionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasDeployment = !!deployment

  // Convert the topic allowlist from the deployment to the format needed for the TriggerDialog
  const channelOptions =
    deployment?.config?.telegram?.topic_allowlist?.map(topic => ({
      value: topic.id,
      label: topic.note || `Topic ${topic.id}`,
    })) || []

  // For a real implementation, this would make an API call to delete a trigger
  const handleDeleteTrigger = (triggerId: string) => {
    console.log(`Delete Telegram trigger with ID: ${triggerId}`)
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
        label="Telegram"
        tooltip="Create a trigger for Telegram"
        disabled={!hasDeployment}
        disabledNote="Deploy your agent on Telegram to configure triggers"
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
              platform="telegram"
              onDelete={handleDeleteTrigger}
              emptyMessage="No Telegram triggers configured yet"
            />

            <div className="h-px bg-border my-1" />

            <TriggerDialog
              channels={channelOptions}
              agentId={agentId}
              platform="telegram"
            />
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
