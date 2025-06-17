import AgentActionsMenu from '@/components/button/agent-actions-menu'
// import LikeButton from '@/components/button/like-button'
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
import {
  CheckIcon,
  MessageSquareIcon,
  SquareMousePointerIcon,
} from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  agent: Agent
  queryKey: QueryKey
  onClick?: (item: Agent) => void
  className?: string
  isSelected?: boolean
  hideContextMenu?: boolean
  improvedLayout?: boolean
}

const AgentCard = ({
  agent,
  queryKey,
  onClick,
  className,
  isSelected,
  hideContextMenu = false,
  improvedLayout = false,
}: Props) => {
  if (improvedLayout) {
    return (
      <Card
        className={cn([
          'relative overflow-hidden border-2 border-border/60 z-10 transition-all group cursor-pointer bg-card/80 h-full w-full',
          onClick
            ? 'hover:bg-muted/80 hover:shadow-md hover:border-border/80'
            : 'hover:ring-2 ring-primary/40 hover:shadow-lg hover:shadow-primary/10',
          isSelected && 'ring-2 ring-primary ring-offset-2',
          className,
        ])}
        onClick={onClick ? () => onClick(agent) : undefined}
      >
        {!agent.public ? <PrivateIcon className="" /> : null}
        {isSelected && (
          <div className="absolute top-2 right-2 z-50 bg-primary text-primary-foreground rounded-full p-1">
            <CheckIcon className="h-4 w-4" />
          </div>
        )}

        <Link
          href={`/chat/${agent.username}`}
          prefetch={false}
          className={cn('block', onClick && 'pointer-events-none')}
        >
          <div className="flex items-center p-4 gap-3 h-full min-h-[140px] w-full overflow-hidden">
            {/* Avatar on the left - vertically centered */}
            <div className="flex-shrink-0 flex items-center w-20">
              <div className="relative w-20 h-20 rounded-full overflow-hidden">
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
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            {/* Metadata on the right - strict width control */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2 overflow-hidden">
              <div className="space-y-1 overflow-hidden">
                {/* Name - strictly truncated */}
                <h3 className="font-semibold text-base leading-tight truncate overflow-hidden">
                  {agent.name}
                </h3>

                {/* Owner - strictly truncated */}
                <p className="text-xs text-muted-foreground truncate overflow-hidden">
                  By{' '}
                  <span className="font-medium">@{agent.owner.username}</span>
                </p>

                {/* Description - limited to 2 lines */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed overflow-hidden">
                  {agent.description}
                </p>
              </div>

              {/* Chat count - aligned to bottom */}
              <div className="flex items-center gap-1 mt-auto flex-shrink-0">
                <MessageSquareIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {formatCompactNumber(agent.stats?.userMessageCount || 0)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  // Original layout
  return (
    <Card
      className={cn([
        'relative overflow-hidden border-0 z-10 transition-all group bg-card/70 hover:ring-2 ring-primary/40 hover:shadow-lg hover:shadow-primary/10',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        className,
      ])}
    >
      {!agent.public ? <PrivateIcon className="" /> : null}
      {isSelected && (
        <div className="absolute top-2 right-2 z-50 bg-primary text-primary-foreground rounded-full p-1">
          <CheckIcon className="h-4 w-4" />
        </div>
      )}
      {onClick ? (
        <div
          className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer z-50 opacity-0 bg-popover group-hover:opacity-50 [@media(pointer:coarse)]:opacity-50 transition-all"
          onClick={() => onClick(agent)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          {isSelected ? 'Deselect' : 'Select'}
        </div>
      ) : null}

      <Link href={`/chat/${agent.username}`} prefetch={false} className="block">
        <div className="relative flex p-2">
          <div className="relative flex-grow shrink-0">
            <div className="relative flex rounded-lg overflow-hidden aspect-[2/3] lg:aspect-square h-[140px] flex-shrink-0 flex-grow-0">
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
                className="object-cover"
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
      <div className="absolute bottom-0 right-0 p-2 flex items-center justify-between shrink-0 pointer-events-none">
        <div className="flex items-center gap-1 ml-auto">
          {/* <LikeButton
            type="agent"
            id={agent._id}
            isLiked={agent.isLiked}
            docQueryKeyId={agent.username}
            likeCount={agent.likeCount}
            className="pointer-events-auto"
            disabled={!isSignedIn}
          /> */}
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
          {!hideContextMenu && (
            <AgentActionsMenu
              agent={agent}
              queryKey={queryKey}
              hiddenItems={['like']}
            />
          )}
        </div>
      </div>
    </Card>
  )
}

export default AgentCard
