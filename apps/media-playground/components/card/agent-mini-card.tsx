import AgentActionsMenu from '@/components/button/agent-actions-menu'
import CardImage from '@/components/card/components/card-image'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import AgentUsageStats from '@/features/agent/statistics/agent-usage-stats'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { MessageSquareIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

interface AgentMiniCardProps {
  agent: Agent
  queryKey: QueryKey
  className?: string
}

export const AgentMiniCard = ({
  agent,
  queryKey,
  className,
}: AgentMiniCardProps) => {
  return (
    <div
      className={cn(
        'relative flex overflow-hidden w-full bg-muted/40 border border-border rounded-lg p-2 hover:border-purple-600/40 hover:bg-purple-600/20 transition-all duration-200 group',
        className,
      )}
    >
      <Link
        href={`/agents/${agent.username}`}
        prefetch={false}
        className="block h-16 flex-grow"
      >
        <div className="relative flex">
          <div className="relative flex rounded-lg overflow-hidden aspect-square h-16 w-16 flex-shrink-0 flex-grow-0">
            <CardImage
              media={{
                url: agent.userImage,
                thumbnail: agent.userImage,
                width: 256,
                height: 256,
                type: 'image',
                blurhash: agent.blurhash,
              }}
              unoptimized={true}
              className="object-cover"
            />
          </div>

          <div className="flex gap-2 flex-col ml-3 w-full">
            <div className="flex gap-1 flex-col w-full">
              <span className="font-semibold text-sm mr-auto">
                {agent.name}
              </span>

              {/* <div className="text-xs text-accent-foreground line-clamp-2">
                {agent.description}
              </div> */}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <div className="flex items-stretch h-9">
                <TooltipTrigger
                  asChild
                  className="pointer-events-auto cursor-help rounded-l-lg rounded-r-none border border-r-0 px-2 flex items-center bg-muted-darker/60 hover:text-primary text-muted-foreground"
                >
                  <div className="text-xs font-mono w-14 flex justify-end">
                    {formatCompactNumber(agent.stats?.userMessageCount)}
                  </div>
                </TooltipTrigger>
                <Button
                  size="icon"
                  variant="outline"
                  asChild
                  aria-label="Chat with agent"
                  className="pointer-events-auto rounded-l-none h-auto"
                >
                  <Link
                    title="Chat with agent"
                    href={`/chat/${agent.username}`}
                    className="w-9 h-9 text-muted-foreground group-hover:text-primary"
                  >
                    <MessageSquareIcon className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <TooltipContent>
                <AgentUsageStats
                  className="my-0 gap-2 !flex-col"
                  agent={agent}
                  showTooltipAsText={true}
                />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <AgentActionsMenu agent={agent} queryKey={queryKey} />
      </div>
    </div>
  )
}

export default AgentMiniCard
