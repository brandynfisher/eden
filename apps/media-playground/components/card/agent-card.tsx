import AgentActionsMenu from '@/components/button/agent-actions-menu'
import CardImage from '@/components/card/components/card-image'
import PrivateIcon from '@/components/icons/private-icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { MessageSquareIcon, SquareMousePointerIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  agent: Agent
  queryKey: QueryKey
  onClick?: (item: Agent) => void
  className?: string
}

const AgentCard = ({ agent, queryKey, onClick, className }: Props) => {
  return (
    <Card
      className={cn([
        'relative overflow-hidden border-0 z-10 transition-shadow group bg-secondary hover:ring-2 ring-purple-600/40',
        className,
      ])}
    >
      {!agent.public ? <PrivateIcon className="" /> : null}
      {onClick ? (
        <div
          className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer z-50 opacity-0 bg-popover group-hover:opacity-50 [@media(pointer:coarse)]:opacity-50 transition-all"
          onClick={() => onClick(agent)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          Select
        </div>
      ) : null}

      <Link
        href={`/agents/${agent.username}`}
        prefetch={false}
        className="block"
      >
        <div className="relative flex p-2">
          <div className="relative flex-grow shrink-0">
            <div className="relative flex">
              <CardImage
                media={{
                  url: agent.userImage,
                  thumbnail: agent.userImage,
                  width: 512,
                  height: 512,
                  type: 'image',
                  blurhash: agent.blurhash,
                }}
                unoptimized={true}
                className="object-cover rounded-lg aspect-square h-[140px] flex-shrink-0 flex-grow-0"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-col ml-3 w-full">
            <div className="flex gap-1 flex-col w-full">
              <span className="font-semibold text-sm mr-auto">
                {agent.name}
              </span>

              <div className="text-xs text-accent-foreground line-clamp-3">
                {agent.description}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground w-full">
              by <span className="font-semibold">{agent.owner.username}</span>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute bottom-0 right-0 p-2 w-[calc(100%-140px)] flex items-center justify-between shrink-0 pointer-events-none">
        <div className="flex items-center gap-1 ml-auto">
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
    </Card>
  )
}

export default AgentCard
