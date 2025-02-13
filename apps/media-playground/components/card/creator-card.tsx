import CardImage from '@/components/card/components/card-image'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Creator } from '@edenlabs/eden-sdk'
import Link from 'next/link'
import React from 'react'

type Props = {
  creator: Creator
  className?: string
}

const CreatorCard = ({ creator, className }: Props) => {
  return (
    <Card
      className={cn([
        'relative overflow-hidden border-0 z-10 transition-shadow group bg-secondary hover:ring-2 ring-purple-600/40',
        className,
      ])}
    >
      <div className="relative flex p-2">
        <div className="relative flex-grow">
          <Link
            href={`/creators/${creator.username}`}
            prefetch={false}
            className="block"
          >
            <div className="relative flex">
              <CardImage
                media={{
                  url: creator.userImage,
                  thumbnail: creator.userImage,
                  width: 512,
                  height: 512,
                  type: 'image',
                  // blurhash: creator.blurhash,
                }}
                unoptimized={true}
                className="object-cover rounded-lg w-[90px] h-[132px] flex-shrink-0 flex-grow-0"
              />
              <div className="ml-3 flex flex-col w-full">
                <span className="font-semibold text-sm mr-auto">
                  {creator.username}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* <div className="flex flex-col justify-between ml-2 h-[132px]">
          <AgentActionsMenu creator={creator} queryKey={queryKey} />
          {creator.stats?.userMessageCount}
          <Button size="icon" variant="outline" asChild>
            <Link
              href={`/chat/${creator.username}`}
              className="w-9 h-9 text-muted-foreground group-hover:text-primary"
            >
              <MessageSquareIcon className="w-4 h-4" />
            </Link>
          </Button>
        </div> */}
      </div>
    </Card>
  )
}

export default CreatorCard
