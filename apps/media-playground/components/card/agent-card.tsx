import AgentActionsMenu from '@/components/button/agent-actions-menu'
import CardImage from '@/components/card/components/card-image'
import PrivateIcon from '@/components/icons/private-icon'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { SquareMousePointerIcon } from 'lucide-react'
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
        'relative overflow-hidden border-0 z-10 transition-shadow group bg-secondary',
        className,
      ])}
    >
      {!agent.public ? <PrivateIcon /> : null}
      {onClick ? (
        <div
          className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer hover:ring-2 ring-offset-1 ring-primary-foreground z-50 opacity-0 bg-popover group-hover:opacity-50 [@media(pointer:coarse)]:opacity-50 transition-all"
          onClick={() => onClick(agent)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          Select
        </div>
      ) : null}
      <Link
        href={`/chat/${agent._id}`}
        prefetch={false}
        className="relative w-full block"
      >
        <div className="relative flex p-2">
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
            className="object-cover rounded-lg w-[90px] h-[114px]"
          />
          <div className="ml-3 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold mr-auto">{agent.name}</span>
              <AgentActionsMenu key={1} agent={agent} queryKey={queryKey} />
            </div>
            <div className="text-sm text-accent-foreground line-clamp-2 mt-2">
              {agent.description}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
              by {agent.owner.username}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

export default AgentCard
