'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { HelpCircle } from 'lucide-react'
import React from 'react'

const formatNumber = (num: number | undefined) => {
  if (num === undefined) return '0'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(num)
    .toLowerCase()
}

const getMagnitudeStyle = (num: number | undefined) => {
  if (num === undefined) return ''
  if (num >= 1000000) return 'bg-blue-600/30 border-blue-600/30'
  if (num >= 100000) return 'bg-blue-600/25 border-blue-600/25'
  if (num >= 50000) return 'bg-blue-600/20 border-blue-600/20'
  if (num >= 1000) return 'bg-blue-600/15 border-blue-600/15'
  return 'bg-blue-600/10 border-blue-600/10'
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
  const [formattedDate, setFormattedDate] = React.useState<string>('')

  React.useEffect(() => {
    if (agent.stats?.lastUpdated) {
      setFormattedDate(new Date(agent.stats.lastUpdated).toLocaleString())
    }
  }, [agent.stats?.lastUpdated])
  const stats = [
    {
      label: 'Users',
      value: formatNumber(agent.stats?.userCount),
      raw: agent.stats?.userCount,
      value7d: formatNumber(agent.stats?.userCount_7d),
      raw7d: agent.stats?.userCount_7d,
    },
    {
      label: 'Threads',
      value: formatNumber(agent.stats?.threadCount),
      raw: agent.stats?.threadCount,
      value7d: formatNumber(agent.stats?.threadCount_7d),
      raw7d: agent.stats?.threadCount_7d,
    },
    {
      label: 'Messages',
      value: formatNumber(agent.stats?.userMessageCount),
      raw: agent.stats?.userMessageCount,
      value7d: formatNumber(agent.stats?.userMessageCount_7d),
      raw7d: agent.stats?.userMessageCount_7d,
    },
    {
      label: 'Replies',
      value: formatNumber(agent.stats?.assistantMessageCount),
      raw: agent.stats?.assistantMessageCount,
      value7d: formatNumber(agent.stats?.assistantMessageCount_7d),
      raw7d: agent.stats?.assistantMessageCount_7d,
    },
    {
      label: 'Tool calls',
      value: formatNumber(agent.stats?.toolCallCount),
      raw: agent.stats?.toolCallCount,
      value7d: formatNumber(agent.stats?.toolCallCount_7d),
      raw7d: agent.stats?.toolCallCount_7d,
    },
  ]
  return (
    <div
      className={cn(
        'flex flex-col rounded-md mt-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-4">
        {stats.map(({ label, value, raw, value7d }) => (
          <TooltipProvider key={label}>
            <Tooltip>
              <TooltipTrigger
                className={`text-xs bg-popover p-1 pr-2 rounded-lg ${
                  label === 'Tool calls'
                    ? 'hidden md:inline-block'
                    : label === 'Replies'
                    ? 'inline-block sm:hidden md:inline-block'
                    : ''
                }`}
              >
                <Badge
                  variant="outline"
                  className={`p-1 px-2 mr-1 rounded-lg font-medium transition-colors !border !border-muted ${getMagnitudeStyle(
                    raw,
                  )}`}
                >
                  {value}
                </Badge>{' '}
                {label}
              </TooltipTrigger>
              <TooltipContent className="flex flex-col gap-1 text-xs">
                <div>Last 24h: {value}</div>
                <div>Last 7d: {value7d}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {!showTooltipAsText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="ml-auto hidden md:block">
                <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Statistics may not reflect real-time data
                <br />
                Last update: {formattedDate}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {showTooltipAsText && (
        <span className="mt-2 text-xs text-muted-foreground hidden md:block">
          Statistics may not reflect real-time data. Last update:{' '}
          {formattedDate}
        </span>
      )}
    </div>
  )
}
