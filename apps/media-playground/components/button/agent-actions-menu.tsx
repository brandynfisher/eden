'use client'

import { getQueryClient } from '@/app/get-query-client'
import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  updateAgentDeploymentFormSheet,
  updateAgentFormSheet,
  updateShareModal,
} from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  Edit2Icon,
  ExternalLinkIcon,
  MessageSquareIcon,
  RocketIcon,
  Share2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

type Props = {
  agent: Agent
  queryKey: QueryKey
  className?: string
}

const AgentActionsMenu = ({ agent, queryKey, className }: Props) => {
  const { user } = useAuthState()
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isFeatureDeploymentsEnabled = user?.featureFlags?.includes(
    FeatureFlag.FeatureDeployments,
  )

  // Include pathname in feedId to differentiate between same queries in different routes
  const feedId = useMemo(
    () => JSON.stringify({ queryKey, path: pathname }),
    [queryKey, pathname],
  )

  const feedStore = useFeedStore(feedId)
  const { addToHistory } = useActiveFeedStore()

  if (!agent) {
    return null
  }

  const handleViewDetails = (evt: React.MouseEvent) => {
    evt.preventDefault()
    const index = feedStore.items.findIndex(item => item._id === agent._id)
    if (index !== -1) {
      feedStore.setActiveIndex(index)
      addToHistory(feedId)
    }
    setIsOpen(false)
    router.push(`/agents/${agent.username}`)
  }

  const handleShareClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault()
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/agents/${agent.username}`
    setIsOpen(false)
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl: shareUrl,
      }),
    )
  }

  const onUpdate = async () => {
    const queryClient = getQueryClient()
    await queryClient.invalidateQueries({ queryKey })
  }

  const handleEditClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault()
    setIsOpen(false)
    dispatch(
      updateAgentFormSheet({
        isOpen: true,
        mode: 'update',
        agent,
        onAction: onUpdate,
      }),
    )
  }

  const handleConfigureDeployments = (
    evt: React.MouseEvent<HTMLButtonElement>,
  ) => {
    evt.preventDefault()
    setIsOpen(false)
    dispatch(updateAgentDeploymentFormSheet({ isOpen: true, agent }))
  }

  return (
    <ActionsDropdown
      open={isOpen}
      className={className}
      onOpenChange={setIsOpen}
    >
      {isOpen && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleViewDetails}
              >
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Details
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/chat/${agent.username}`} className="cursor-pointer">
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Chat
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="cursor-pointer">
              <button
                type="button"
                className="w-full"
                onClick={handleShareClick}
              >
                <Share2Icon className="mr-2 h-4 w-4" />
                Share
              </button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {agent.owner._id === user?._id && (
            <>
              {isFeatureDeploymentsEnabled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <button
                      type="button"
                      onClick={handleConfigureDeployments}
                      className="w-full"
                    >
                      <RocketIcon className="mr-2 h-4 w-4" />
                      Deployments
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild className="cursor-pointer">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="w-full"
                >
                  <Edit2Icon className="mr-2 h-4 w-4" />
                  Edit
                </button>
              </DropdownMenuItem>
              <DropdownMenuGroup>
                <PrivacyActionItem
                  type="agent"
                  item={agent}
                  queryKey={queryKey}
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DeleteActionItem
                  type="agent"
                  item={agent}
                  queryKey={queryKey}
                />
              </DropdownMenuGroup>
            </>
          )}
        </>
      )}
    </ActionsDropdown>
  )
}

export default AgentActionsMenu
