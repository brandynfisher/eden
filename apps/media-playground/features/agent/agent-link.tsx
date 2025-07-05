import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AgentBasicInfo } from '@/lib/actions/agent'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import Link from 'next/link'
import { FC } from 'react'

const AgentLink: FC<{
  agent?: AgentBasicInfo | Agent
  className?: string
  hideName?: boolean
  avatarClassName?: string
}> = ({ agent, className, hideName, avatarClassName }) => {
  return (
    <Link
      className={cn(
        'w-full md:ml-0 flex self-center items-center gap-2 text-sm text-muted-foreground hover:text-accent-foreground',
        className,
      )}
      title="View Agent profile"
      href={`/chat/${agent?.username}`}
    >
      <Avatar
        className={cn(
          'w-6 h-6 md:w-8 md:h-8 col-start-1 row-span-full row-start-1',
          avatarClassName,
        )}
      >
        <AvatarImage
          alt={agent?.name}
          className={'object-cover'}
          src={getCloudfrontOriginalUrl(agent?.userImage)}
        />
        <AvatarFallback
          delayMs={250}
          className={cn(['w-6 h-6 md:w-8 md:h-8', avatarClassName])}
        >
          {agent?.name?.[0]}
        </AvatarFallback>
      </Avatar>
      {!hideName && <span className="truncate">{agent?.name}</span>}
    </Link>
  )
}

export default AgentLink
