'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Agent } from '@edenlabs/eden-sdk'
import { HelpCircle } from 'lucide-react'
import React from 'react'

export default function AgentUsageStats({ agent }: { agent: Agent }) {
  const [formattedDate, setFormattedDate] = React.useState<string>('')

  React.useEffect(() => {
    if (agent.stats?.lastUpdated) {
      setFormattedDate(new Date(agent.stats.lastUpdated).toLocaleString())
    }
  }, [agent.stats?.lastUpdated])
  const stats = [
    { label: 'Messages', value: agent.stats?.userMessageCount },
    { label: 'Threads', value: agent.stats?.threadCount },
    { label: 'Users', value: agent.stats?.userCount },
    { label: 'Replies', value: agent.stats?.assistantMessageCount },
    { label: 'Tool calls', value: agent.stats?.toolCallCount },
  ]
  return (
    <div className="flex flex-wrap p-2 border rounded-md items-center mt-4 gap-2 text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-2">
        {stats.map(({ label, value }) => (
          <span
            key={label}
            className="text-xs bg-secondary p-1 pr-1.5 rounded-md"
          >
            <Badge
              variant="outline"
              className="bg-popover p-1 px-2 mr-0.5 rounded-md font-medium"
            >
              {value}
            </Badge>{' '}
            {label}
          </span>
        ))}
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="ml-auto">
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            May not reflect real-time data
            <br />
            Last update: {formattedDate}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
