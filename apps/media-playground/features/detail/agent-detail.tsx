'use client'

import AgentActionsMenu from '@/components/button/agent-actions-menu'
import LikeButton from '@/components/button/like-button'
import ModelMiniCard from '@/components/card/model-mini-card'
import RecentCreationsFeed from '@/components/feed/recent-creations-feed'
import TextClampMore from '@/components/text/text-clamp-more'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import UserAvatarLink from '@/components/user/user-avatar-link'
import AgentUsageStats from '@/features/agent/statistics/agent-usage-stats'
import { handleShareClick } from '@/features/detail/agent-share-util'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  updateAgentDeploymentFormSheet,
  updateAgentFormSheet,
  updateAgentTriggerFormSheet,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import {
  ChevronDownIcon,
  ClockIcon,
  EyeOffIcon,
  MessageSquareIcon,
  RocketIcon,
  SettingsIcon,
  Share2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type Props = {
  id: string
  agentSSRData?: Agent
  scrollRef?: RefObject<HTMLDivElement>
}

// Define filter types within AgentDetail
type FilterMode = 'all' | 'mine'

const AgentDetail = ({ id, agentSSRData, scrollRef }: Props) => {
  const { user, isSignedIn } = useAuthState()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use standard useState again
  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    // Initialize state from URL search param on mount
    const initialTab = searchParams.get('tab')
    return initialTab === 'mine' ? 'mine' : 'all' // Default to 'all'
  })

  // State to hold the scroll INDEX target read from history state
  const [initialScrollIndex, setInitialScrollIndex] = useState<number | null>(
    null,
  )

  // Callback to clear state after scroll restore
  const clearScrollIndexState = useCallback(() => {
    // console.log('[AgentDetail] Clearing initialScrollIndex')
    setInitialScrollIndex(null)
    // REMOVE URL param clearing logic
  }, []) // No dependencies needed now

  // Effect to read initial scroll INDEX from history state
  useEffect(() => {
    // Read scrollIndex from history state
    const historyScrollIndex = window.history.state?.scrollIndex

    // console.log(
    //   `[AgentDetail] Scroll check effect: historyScrollIndex=${historyScrollIndex}`,
    // )

    // If the history state exists, attempt to read and set state
    if (typeof historyScrollIndex === 'number') {
      const scrollIndex = historyScrollIndex
      // console.log(
      //   '[AgentDetail] Read initial scroll index from history state:',
      //   scrollIndex,
      // )
      setInitialScrollIndex(scrollIndex)
      // console.log(
      //   '[AgentDetail] Read initial scroll index from history state:',
      //   scrollIndex,
      // )
      setInitialScrollIndex(scrollIndex)
      // Clear the history state immediately after reading
      try {
        const currentState = window.history.state || {}
        // Manually build restState if scrollIndex exists
        if (
          typeof currentState === 'object' &&
          currentState !== null &&
          'scrollIndex' in currentState
        ) {
          const restState: Record<string, unknown> = {}
          for (const key in currentState) {
            if (key !== 'scrollIndex') {
              // Clear scrollIndex
              restState[key] = currentState[key]
            }
          }
          window.history.replaceState(restState, '')
          // console.log('[AgentDetail] Cleared scrollIndex from history state')
        }
      } catch (e) {
        console.error('Error clearing history state:', e)
      }
    }
    // Depend on searchParams/router to potentially catch navigation events
  }, [searchParams, router, id])

  // Effect to update URL when filterMode changes
  useEffect(() => {
    const currentTab = searchParams.get('tab')
    const newTabValue = filterMode === 'mine' ? 'mine' : null // null removes the param

    // Avoid pushing the same state
    if (currentTab === newTabValue || (!currentTab && !newTabValue)) {
      return
    }

    // Create new URLSearchParams but preserve other params
    const params = new URLSearchParams(searchParams.toString())
    if (newTabValue) {
      params.set('tab', newTabValue)
    } else {
      params.delete('tab')
    }

    // Use history.replaceState directly to avoid Next.js routing
    // Ensure we're updating both the URL and the state
    const newSearch = params.toString()
    const newUrl = `${window.location.pathname}${
      newSearch ? '?' + newSearch : ''
    }`

    // Update the URL and trigger a re-render by updating searchParams
    window.history.replaceState(
      { ...window.history.state, as: newUrl, url: newUrl },
      '',
      newUrl,
    )

    // Force a re-render of components that depend on searchParams
    const event = new PopStateEvent('popstate', { state: window.history.state })
    window.dispatchEvent(event)
  }, [filterMode, searchParams])

  const feedSectionRef = useRef<HTMLDivElement>(null)
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

  // Construct the query for RecentCreationsFeed based on filterMode
  const recentCreationsQuery = useMemo(() => {
    if (!agent) return {}
    const baseAgentQuery = { agent: agent._id }
    if (filterMode === 'mine' && user?._id) {
      return { ...baseAgentQuery, user: user._id }
    }
    return baseAgentQuery
  }, [agent, filterMode, user?._id])

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

  const handleConfigureTriggers = () => {
    dispatch(
      updateAgentTriggerFormSheet({
        isOpen: true,
        agentId: agent?._id,
      }),
    )
  }

  if (!agent) return null

  // Determine if the filter tabs should be shown
  const showFilterTabs = isSignedIn && !!user

  return (
    <>
      <div className="relative flex flex-col gap-4 p-4 bg-muted-darker rounded-md mx-2 md:mx-4 mt-4">
        <div className="relative lg:flex lg:justify-between lg:gap-x-4">
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

              <div className="flex items-center mt-4 gap-x-1 text-sm text-muted-foreground mb-4">
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
                      className="gap-2"
                      variant="outline"
                      onClick={handleEditClick}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Edit
                    </Button>
                    {isFeatureDeploymentsEnabled && (
                      <>
                        <Button
                          className="gap-2"
                          variant="outline"
                          onClick={handleConfigureDeployments}
                        >
                          <RocketIcon size={18} />
                          Deployments
                        </Button>
                        <Button
                          className="gap-2"
                          variant="outline"
                          onClick={handleConfigureTriggers}
                        >
                          <ClockIcon size={18} />
                          Tasks
                        </Button>
                      </>
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
                  <LikeButton
                    type="agent"
                    id={agent._id}
                    isLiked={agent.isLiked}
                    likeCount={agent.likeCount}
                    docQueryKeyId={id}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
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
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <AgentUsageStats
                          className="my-0 gap-2 !flex-col"
                          agent={agent}
                          showTooltipAsText={true}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
        <div className="flex flex-col md:flex-row gap-4">
          {(agent?.isPersonaPublic || user?._id === agent?.owner._id) && (
            <div className="flex flex-1 flex-col p-4 md:max-w-[50%] bg-muted/50 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TypographyH6 className="text-primary">Persona</TypographyH6>
              </div>
              {!agent?.isPersonaPublic && user?._id === agent?.owner._id && (
                <>
                  <div className="text-sm italic text-muted-foreground flex items-center gap-2 mb-2">
                    <EyeOffIcon className="w-4 h-4" />
                    This persona is not public.
                  </div>
                  <Separator className="mb-2" />
                </>
              )}
              <TextClampMore
                lines={3}
                text={agent?.persona}
                className="text-sm italic text-accent-foreground"
              />
            </div>
          )}
          {agent?.models && agent.models.length > 0 && (
            <div className="flex flex-1 flex-col h-fit md:max-w-[50%] p-4 bg-muted/50 rounded-lg border border-border/50 gap-2">
              <TypographyH6 className="text-primary">Models</TypographyH6>
              <div className="flex flex-col gap-2">
                {agent.models.map((model: { lora: string }, index: number) => (
                  <ModelMiniCard key={index} modelId={model.lora} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouncy Arrow and Title (Moved Here) */}
      {agent && (
        <>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer self-center animate-bounce"
            >
              <ChevronDownIcon className="w-10 h-10" />
            </Button>
          </div>
          <div className="flex text-sm items-center gap-2 justify-center mb-2 pt-4 pb-6 lg:pt-8 lg:pb-8 px-4">
            {`Creations with ${agent.name}`}
          </div>

          {/* Feed Section Start - Attach Ref Here */}
          <div ref={feedSectionRef}>
            {/* Filter Tabs */}
            {showFilterTabs && (
              <Tabs
                value={filterMode}
                onValueChange={value => {
                  setFilterMode(value as FilterMode)
                }}
                className="w-full flex justify-center mb-4 px-4"
              >
                <TabsList>
                  <TabsTrigger value="all">All Creations</TabsTrigger>
                  <TabsTrigger value="mine">My Creations</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Recent Creations Feed Component */}
            <RecentCreationsFeed
              query={recentCreationsQuery}
              scrollRef={scrollRef}
              initialScrollIndex={initialScrollIndex}
              onScrollRestored={clearScrollIndexState}
            />
          </div>
        </>
      )}
    </>
  )
}

export default AgentDetail
