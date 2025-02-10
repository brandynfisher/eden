'use client'

import AgentActionsMenu from '@/components/button/agent-actions-menu'
import TextClampMore from '@/components/text/text-clamp-more'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
// import { Badge } from '@/components/ui/badge'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import CreationsFeed from '@/features/feed/creations-feed'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent } from '@edenlabs/eden-sdk'
import { AvatarFallback } from '@radix-ui/react-avatar'
import { ChatBubbleIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import React from 'react'

type Props = {
  id: string
  agentSSRData?: Agent
}

const AgentDetail = ({ id, agentSSRData }: Props) => {
  const { isSignedIn, user } = useAuthState()

  const { agent: agentClientData } = useAgentQuery({
    key: id,
    initialData: agentSSRData
      ? {
          agent: agentSSRData,
        }
      : undefined,
  })

  const agent = agentClientData || agentSSRData

  if (!agent) return null
  return (
    <>
      <div className="relative p-6 bg-muted-darker rounded-md mx-4 mt-4">
        <div className="relative flex">
          <Avatar className="h-full aspect-[9/16] max-h-40 rounded-lg flex-shrink-0">
            {agent.userImage ? (
              <AvatarImage
                className="object-cover rounded-lg"
                src={agent.userImage}
              />
            ) : (
              <AvatarFallback className="rounded-lg">
                {agent.name[0]}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="ml-4 flex flex-col flex-grow">
            <div className="flex flex-wrap items-center justify-between">
              <h1 className="text-2xl font-semibold mb-2 md:mb-0">
                {agent?.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                <AgentActionsMenu
                  className="size-10"
                  key={1}
                  agent={agent}
                  queryKey={['agents', id]}
                  hiddenItems={['chat', 'view-details']}
                />
                <Button variant="outline" asChild>
                  <Link
                    href={`/chat/${agent.username}`}
                    className=" bg-purple-600/20 border-purple-600"
                  >
                    <ChatBubbleIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">Chat</span>
                  </Link>
                </Button>
              </div>
            </div>

            <TextClampMore
              lines={3}
              text={agent?.description}
              className="text-sm break-words mt-4 text-muted-darker-foreground"
            />

            <div className="flex items-center mt-2 gap-x-1 text-sm text-muted-foreground">
              by
              <Link href={`/creators/${agent.owner.username}`}>
                {agent.owner.username}
              </Link>
            </div>
          </div>
        </div>
        {/* <Separator className="my-4" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent-foreground/5 rounded-md p-2">
          <div>
            Threads
            <Badge variant="outline" className="bg-muted-darker">
              {agent.threadCount}
            </Badge>
          </div>
          <div>
            Messages
            <Badge variant="outline" className="bg-muted-darker">
              {agent.threadCount}
            </Badge>
          </div>
          <div>
            Users
            <Badge variant="outline" className="bg-muted-darker">
              {agent.threadCount}
            </Badge>
          </div>
        </div> */}
      </div>
      <div className="p-4">
        {isSignedIn ? (
          !!user && (
            <div>
              <TypographyH6 className="mb-4">
                Your Creations with {agent?.name}
              </TypographyH6>
              <CreationsFeed
                query={{ user: agent._id, requester: user?._id }}
              />
            </div>
          )
        ) : (
          <CreationsFeed query={{ user: agent._id }} />
        )}
      </div>
    </>
  )
}

export default AgentDetail
