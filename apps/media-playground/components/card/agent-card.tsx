import AgentActionsMenu from '@/components/button/agent-actions-menu'
// import LikeButton from '@/components/button/like-button'
import { FarcasterIcon } from '@/components/icons/farcaster'
import PrivateIcon from '@/components/icons/private-icon'
import TwitterIcon from '@/components/icons/twitter'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import AgentUsageStats from '@/features/agent/statistics/agent-usage-stats'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { formatCompactNumber } from '@/lib/strings'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  CheckIcon,
  GlobeIcon,
  MessageSquareIcon,
  SettingsIcon,
  SquareMousePointerIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  agent: Agent
  queryKey?: QueryKey
  onClick?: (item: Agent) => void
  onSettings?: () => void
  className?: string
  isSelected?: boolean
  hideContextMenu?: boolean
  improvedLayout?: boolean
  showSettings?: boolean
}

const AgentCard = ({
  agent,
  queryKey,
  onClick,
  onSettings,
  className,
  isSelected,
  hideContextMenu = false,
  improvedLayout = false,
  showSettings = false,
}: Props) => {
  const router = useRouter()
  const imageSrc =
    agent.userImage && agent.userImage.trim()
      ? getCloudfrontOriginalUrl(agent.userImage)
      : undefined
  const description = agent.description || 'No description provided yet.'
  const messageCount = agent.stats?.messageCount || 0

  if (improvedLayout) {
    return (
      <div
        className={cn(
          'group flex flex-row rounded-xl border bg-background/80 backdrop-blur-sm cursor-pointer relative',
          'border-border/70 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/8',
          'transition-all duration-200 h-full min-h-[200px] overflow-hidden',
          // Selected state
          isSelected && [
            'border-primary bg-primary/5',
            'shadow-lg shadow-primary/25',
            'hover:shadow-xl hover:shadow-primary/30',
          ],
          className,
        )}
        onClick={() => {
          if (onClick) {
            onClick(agent)
          } else {
            router.push(`/agents/${agent.username}`)
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (onClick) {
              onClick(agent)
            } else {
              router.push(`/agents/${agent.username}`)
            }
          }
        }}
      >
        {isSelected && (
          <div className="absolute top-3 right-3 z-50 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg shadow-primary/50 ring-2 ring-background">
            <CheckIcon className="h-4 w-4" />
          </div>
        )}

        {/* Left column: Avatar + Website */}
        <div className="shrink-0 w-36 flex flex-col items-center justify-center p-4 gap-2">
          <Avatar className="w-full aspect-square rounded-lg">
            <AvatarImage
              src={imageSrc}
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-3xl font-semibold rounded-lg">
              {agent.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center justify-center gap-3 h-8">
            {agent.website && (
              <Link
                href={agent.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <GlobeIcon className="w-5 h-5" />
              </Link>
            )}
            {agent.social_accounts?.twitter && (
              <Link
                href={`https://twitter.com/${agent.social_accounts.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="hover:opacity-80 transition-opacity"
              >
                <TwitterIcon size={18} />
              </Link>
            )}
            {agent.social_accounts?.farcaster && (
              <Link
                href={`https://warpcast.com/${agent.social_accounts.farcaster}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[#855DCD] hover:opacity-80 transition-opacity"
              >
                <FarcasterIcon size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* Right column: Content */}
        <div className="flex flex-col flex-1 min-w-0 py-4 pr-4">
          {/* Settings button - top right */}
          {showSettings && onSettings && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 absolute top-3 right-3"
              onClick={e => {
                e.stopPropagation()
                onSettings()
              }}
              aria-label="Agent settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          )}

          {/* Name and Owner */}
          <div className="min-w-0 pr-8">
            <h3 className="font-semibold text-lg leading-tight truncate">
              {agent.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              by{' '}
              <span className="font-medium">
                @{agent.owner?.username || agent.username}
              </span>
            </p>
          </div>

          {/* Description - fixed 3 lines height */}
          <p className="text-[15px] text-muted-foreground line-clamp-3 mt-2 leading-snug min-h-[3.6em]">
            {description}
          </p>

          {/* Bottom row: Message count + Chat button */}
          <div className="flex items-center justify-between mt-auto pt-3 gap-2">
            {/* Message count */}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <MessageSquareIcon className="h-3.5 w-3.5" />
              {formatCompactNumber(messageCount)} messages
            </span>

            {/* Chat Button */}
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-4 text-sm"
              onClick={e => {
                e.stopPropagation()
                router.push(`/chat?agent=${agent.username}`)
              }}
            >
              Chat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Original layout
  return (
    <Card
      className={cn([
        'relative overflow-hidden z-10 transition-all duration-300 group',
        // Base state
        !isSelected &&
          'border-0 bg-card/70 hover:ring-2 ring-primary/40 hover:shadow-lg hover:shadow-primary/10',
        // Selected state - bold border with glow and background tint
        isSelected && [
          'border-2 border-primary bg-primary/5',
          'shadow-lg shadow-primary/25',
          'hover:shadow-xl hover:shadow-primary/30',
        ],
        className,
      ])}
    >
      {!agent.public ? <PrivateIcon className="" /> : null}
      {isSelected && (
        <div className="absolute top-3 right-3 z-50 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg shadow-primary/50 ring-2 ring-background">
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
            <div className="relative flex rounded-lg overflow-hidden aspect-[2/3] lg:aspect-square h-[140px] flex-shrink-0 flex-grow-0 items-center justify-center">
              <Avatar className="w-full h-full rounded-lg">
                <AvatarImage
                  src={
                    agent.userImage && agent.userImage.trim()
                      ? getCloudfrontOriginalUrl(agent.userImage)
                      : undefined
                  }
                  alt={agent.name}
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className="bg-muted text-2xl font-medium w-full h-full rounded-lg flex items-center justify-center">
                  {agent.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
          {/* Website link icon */}
          {agent.website && (
            <Button
              size="icon"
              variant="outline"
              asChild
              aria-label="Visit website"
              className="pointer-events-auto h-9 w-9 bg-muted-darker/60 text-muted-foreground hover:text-primary"
            >
              <Link
                href={agent.website}
                target="_blank"
                rel="noopener noreferrer"
                title="Visit website"
                onClick={e => e.stopPropagation()}
              >
                <GlobeIcon className="w-4 h-4" />
              </Link>
            </Button>
          )}
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
                      {formatCompactNumber(agent.stats?.messageCount)}
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
          {!hideContextMenu && queryKey && (
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
