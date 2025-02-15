'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

const StatsHintContent = ({ formattedDate }: { formattedDate: string }) => {
  return (
    <div>
      Statistics may not reflect real-time data.
      <br /> Last update: {formattedDate}
    </div>
  )
}

export default function AgentUsageStats({
  agent,
  className,
  showTooltipAsText = false,
}: {
  agent: Agent
  className?: string
  showTooltipAsText?: boolean
}) {
  const [formattedDate, setFormattedDate] = useState<string>('')

  useEffect(() => {
    if (agent.stats?.lastUpdated) {
      setFormattedDate(new Date(agent.stats.lastUpdated).toLocaleString())
    }
  }, [agent.stats?.lastUpdated])
  const stats = [
    {
      label: 'Users',
      value: formatCompactNumber(agent.stats?.userCount),
      raw: agent.stats?.userCount,
      value7d: formatCompactNumber(agent.stats?.userCount_7d),
      raw7d: agent.stats?.userCount_7d,
    },
    {
      label: 'Threads',
      value: formatCompactNumber(agent.stats?.threadCount),
      raw: agent.stats?.threadCount,
      value7d: formatCompactNumber(agent.stats?.threadCount_7d),
      raw7d: agent.stats?.threadCount_7d,
    },
    {
      label: 'Messages',
      value: formatCompactNumber(agent.stats?.userMessageCount),
      raw: agent.stats?.userMessageCount,
      value7d: formatCompactNumber(agent.stats?.userMessageCount_7d),
      raw7d: agent.stats?.userMessageCount_7d,
    },
    {
      label: 'Replies',
      value: formatCompactNumber(agent.stats?.assistantMessageCount),
      raw: agent.stats?.assistantMessageCount,
      value7d: formatCompactNumber(agent.stats?.assistantMessageCount_7d),
      raw7d: agent.stats?.assistantMessageCount_7d,
    },
    {
      label: 'Tool Calls',
      value: formatCompactNumber(agent.stats?.toolCallCount),
      raw: agent.stats?.toolCallCount,
      value7d: formatCompactNumber(agent.stats?.toolCallCount_7d),
      raw7d: agent.stats?.toolCallCount_7d,
    },
  ]
  return (
    <div
      className={cn(
        'flex flex-wrap lg:flex-col rounded-md text-sm text-muted-foreground',
        className,
      )}
    >
      {stats.map(({ label, value, value7d }) => (
        <TooltipProvider key={label}>
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'cursor-help flex justify-items-start flex-shrink-0 items-center gap-x-2 text-xs bg-muted p-1 pr-2 rounded-lg border border-secondary',
                !showTooltipAsText && label === 'Tool Calls'
                  ? 'hidden md:flex'
                  : '',
                !showTooltipAsText && label === 'Replies'
                  ? 'hidden sm:flex'
                  : '',
                !showTooltipAsText && label === 'Threads'
                  ? 'hidden xs:flex'
                  : '',
              )}
            >
              <Badge
                variant="outline"
                className="p-1 px-2 w-14 flex justify-end rounded-lg font-medium font-mono transition-colors bg-muted-darker"
              >
                {value}
              </Badge>{' '}
              <span className="text-xs shrink-0">{label}</span>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col gap-1 text-xs">
              <div>Last 7d: {value7d}</div>
              <div>Total: {value}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {showTooltipAsText && (
        <span className="text-xs text-muted-foreground text-center">
          <Separator className="mt-0 mb-2" />
          <StatsHintContent formattedDate={formattedDate} />
        </span>
      )}
    </div>
  )
}
