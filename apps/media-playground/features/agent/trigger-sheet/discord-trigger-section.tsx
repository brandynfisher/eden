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
    message: 'Post daily updates about trending topics in technology',
    schedule: {
      hour: 9,
      minute: 0,
      day_of_week: '1-5',
      start_date: new Date(),
    },
    channels: [
      { id: 'general', name: 'general' },
      { id: 'random', name: 'random' },
    ],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
  {
    id: '2',
    message:
      "Remind everyone about the weekly team meeting and generate a summary of discussion topics based on the week's activities",
    schedule: {
      hour: 14,
      minute: 30,
      day_of_week: '4', // Thursday
      start_date: new Date(),
    },
    channels: [{ id: 'team-announcements', name: 'team-announcements' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
  },
  {
    id: '3',
    message:
      'Send a monthly product roadmap update with key milestones and upcoming features',
    schedule: {
      hour: 10,
      minute: 0,
      day: 1, // First day of month
      start_date: new Date(),
    },
    channels: [
      { id: 'product', name: 'product' },
      { id: 'development', name: 'development' },
    ],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
  },
  {
    id: '4',
    message: 'Post weekend inspiration and creative prompts for the team',
    schedule: {
      hour: 16,
      minute: 0,
      day_of_week: '5', // Friday
      start_date: new Date(),
    },
    channels: [{ id: 'random', name: 'random' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 7)),
  },
  {
    id: '5',
    message:
      'Hourly system health check report with metrics on API performance, database status, and server load',
    schedule: {
      minute: 0,
      start_date: new Date(),
    },
    channels: [{ id: 'monitoring', name: 'monitoring' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 14)),
  },
  {
    id: '6',
    message:
      'Compile and share daily customer feedback and feature requests from support tickets',
    schedule: {
      hour: 17,
      minute: 0,
      start_date: new Date(),
    },
    channels: [
      { id: 'customer-insights', name: 'customer-insights' },
      { id: 'product', name: 'product' },
    ],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
  },
  {
    id: '7',
    message: 'Weekend social media content schedule and engagement statistics',
    schedule: {
      hour: 9,
      minute: 30,
      day_of_week: '0,6', // Saturday and Sunday
      start_date: new Date(),
    },
    channels: [{ id: 'marketing', name: 'marketing' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)),
  },
  {
    id: '8',
    message:
      'Generate a list of industry news and competitor updates for the leadership team',
    schedule: {
      hour: 7,
      minute: 0,
      day_of_week: '1', // Monday
      start_date: new Date(),
    },
    channels: [{ id: 'leadership', name: 'leadership' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 12)),
  },
  {
    id: '9',
    message:
      "Collect and summarize this sprint's progress across all development teams",
    schedule: {
      hour: 16,
      minute: 0,
      day_of_week: '5', // Friday
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    },
    channels: [
      { id: 'development', name: 'development' },
      { id: 'product', name: 'product' },
    ],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
  },
  {
    id: '10',
    message:
      'Send personalized weekly goals and achievements to each team member',
    schedule: {
      hour: 9,
      minute: 0,
      day_of_week: '1', // Monday
      start_date: new Date(),
    },
    channels: [{ id: 'team-members', name: 'team-members' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 6)),
  },
]

type DiscordTriggerSectionProps = {
  agentId: string
  deployment?: Deployment
}

export const DiscordTriggerSection = ({
  agentId,
  deployment,
}: DiscordTriggerSectionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasDeployment = !!deployment

  // Convert the channel allowlist from the deployment to the format needed for the TriggerDialog
  const channelOptions =
    deployment?.config?.discord?.channel_allowlist?.map(channel => ({
      value: channel.id,
      label: channel.note || `Channel ${channel.id}`,
    })) || []

  // For a real implementation, this would make an API call to delete a trigger
  const handleDeleteTrigger = (triggerId: string) => {
    console.log(`Delete trigger with ID: ${triggerId}`)
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
        label="Discord"
        tooltip="Create a trigger for Discord"
        disabled={!hasDeployment}
        disabledNote="Deploy your agent on Discord to configure triggers"
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
              platform="discord"
              onDelete={handleDeleteTrigger}
              emptyMessage="No Discord triggers configured yet"
            />

            <div className="h-px bg-border my-1" />

            <TriggerDialog
              channels={channelOptions}
              agentId={agentId}
              platform="discord"
            />
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
