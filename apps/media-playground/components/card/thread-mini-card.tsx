'use client'

import CardImage from '@/components/card/components/card-image'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Thread } from '@edenlabs/eden-sdk'
import { ChevronRight } from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Link from 'next/link'
import React from 'react'

interface ThreadMiniCardProps {
  thread: Thread
  className?: string
}

export const ThreadMiniCard = ({ thread, className }: ThreadMiniCardProps) => {
  const { TimeAgo } = useTimeAgo()
  return (
    <Link
      href={`/chat/${thread.agent.username}/${thread._id}`}
      prefetch={false}
      className={cn(
        'relative flex overflow-hidden w-full bg-muted/40 border border-border rounded-lg p-2 hover:border-purple-600/40 hover:bg-purple-600/20 transition-all duration-200 group',
        className,
      )}
    >
      <div className="relative flex rounded-lg overflow-hidden aspect-square h-10 w-10 flex-shrink-0 flex-grow-0">
        <CardImage
          media={{
            url: getCloudfrontOriginalUrl(thread.agent.userImage),
            thumbnail: getCloudfrontOriginalUrl(thread.agent.userImage),
            width: 256,
            height: 256,
            type: 'image',
            blurhash: thread.agent.blurhash,
          }}
          unoptimized={true}
          className="object-cover"
        />
      </div>

      <div className="flex flex-col ml-3 min-w-0 flex-1">
        <div className="flex flex-col w-full min-w-0">
          <div className="font-semibold text-sm truncate mb-1">
            {thread.title || 'Untitled Thread'}
          </div>
          <div className="flex items-center text-xs text-accent-foreground">
            <span className="truncate">{thread.agent.name}</span>
            <span className="text-muted-foreground ml-auto flex-shrink-0 flex items-center gap-0.5">
              <TimeAgo date={thread.updatedAt} locale="en-short" /> ago
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ThreadMiniCard
