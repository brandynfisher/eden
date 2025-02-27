'use client'

import AgentActionsMenu from '@/components/button/agent-actions-menu'
import TextClampMore from '@/components/text/text-clamp-more'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import UserAvatarLink from '@/components/user/user-avatar-link'
import AgentUsageStats from '@/features/agent/statistics/agent-usage-stats'
import { handleShareClick } from '@/features/detail/agent-share-util'
import CreationsFeed from '@/features/feed/creations-feed'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  updateAgentDeploymentFormSheet,
  updateAgentFormSheet,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import {
  MessageSquareIcon,
  RocketIcon,
  SettingsIcon,
  Share2Icon,
} from 'lucide-react'
import Link from 'next/link'
import React, { RefObject } from 'react'

type Props = {
  id: string
  agentSSRData?: Agent
  scrollRef?: RefObject<HTMLDivElement>
}

const AgentDetail = ({ id, agentSSRData, scrollRef }: Props) => {
  const { isSignedIn, user } = useAuthState()
  const dispatch = useAppDispatch()
  const isFeatureDeploymentsEnabled = user?.featureFlags?.includes(
    FeatureFlag.FeatureDeployments,
  )

  const { agent: agentClientData, invalidate } = useAgentQuery({
    key: id,
    initialData: agentSSRData
      ? {
          agent: agentSSRData,
        }
      : undefined,
  })

  const agent = agentClientData || agentSSRData

  const onUpdateAgent = async () => {
    await invalidate()
  }

  const handleEditClick = () => {
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'update',
        agentId: agent?._id,
        onAction: onUpdateAgent,
      }),
    )
  }

  const handleConfigureDeployments = () => {
    dispatch(
      updateAgentDeploymentFormSheet({
        isOpen: true,
        agentId: agent?._id,
      }),
    )
  }

  if (!agent) return null

  return (
    <>
      <div className="relative lg:flex lg:justify-between lg:gap-x-4 p-4 bg-muted-darker rounded-md mx-2 md:mx-4 mt-4">
        <div className="relative flex flex-col sm:flex-row">
          <Avatar className="aspect-square h-40 md:h-52 rounded-lg flex-shrink-0">
            {agent.userImage ? (
              <AvatarImage
                className="object-cover rounded-lg shadow-md"
                src={agent.userImage}
              />
            ) : (
              <AvatarFallback className="rounded-lg">
                {agent.name[0]}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col flex-grow max-w-2xl">
            <div className="flex flex-wrap items-center justify-between">
              <h1 className="text-2xl font-semibold mb-2 sm:mb-0">
                {agent?.name}
              </h1>
            </div>

            <TextClampMore
              lines={3}
              text={agent?.description}
              className="text-sm break-words sm:mt-4 text-muted-darker-foreground"
            />

            <div className="flex items-center mt-2 gap-x-1 text-sm text-muted-foreground mb-4">
              <span className="mr-1">by</span>
              <UserAvatarLink
                name={agent.owner.username}
                image={agent.owner.userImage}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-auto">
              {user?._id === agent?.owner._id && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleEditClick}
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </Button>
                  {isFeatureDeploymentsEnabled && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleConfigureDeployments}
                    >
                      <RocketIcon size={18} />
                    </Button>
                  )}
                  <AgentActionsMenu
                    className="size-10"
                    key={1}
                    agent={agent}
                    queryKey={['agents', id]}
                    hiddenItems={['chat', 'view-details']}
                  />
                </>
              )}
              <div className="flex items-center gap-2">
                <AgentUsageStats
                  agent={agent}
                  hiddenStats={[
                    'toolCallCount',
                    'assistantMessageCount',
                    'threadCount',
                    'userCount',
                  ]}
                  className="lg:mt-0 gap-2"
                />
                {user?._id !== agent?.owner._id && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={evt => handleShareClick(evt, agent, dispatch)}
                  >
                    <Share2Icon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" asChild>
                <Link
                  href={`/chat/${agent.username}`}
                  className=" bg-purple-600/20 border-purple-600"
                >
                  <MessageSquareIcon className="w-4 h-4 mr-2" />
                  <span className="text-sm">Chat</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
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
                scrollRef={scrollRef}
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
