'use client'

//import { getQueryClient } from '@/app/get-query-client'
import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
// import LikeButton from '@/components/button/like-button'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { handleShareClick } from '@/features/detail/agent-share-util'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
//import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { useActiveFeedStore, useFeedStore } from '@/zustand/feed-store'
import { Agent } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import {
  ExternalLinkIcon,
  MessageSquareIcon,
  SettingsIcon,
  Share2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

type Props = {
  agent: Agent
  queryKey: QueryKey
  className?: string
  hiddenItems?: (
    | 'view-details'
    | 'chat'
    | 'share'
    | 'like'
    | 'edit'
    | 'deployments'
    | 'tasks'
    | 'privacy'
    | 'delete'
  )[]
  onEdit?: () => void
}

const AgentActionsMenu = ({
  agent,
  queryKey,
  className,
  hiddenItems,
  onEdit,
}: Props) => {
  const { user } = useAuthState()
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const {
    hasOwnerAccess,
    hasEditAccess,
    isLoading: isPermissionsLoading,
  } = useAgentPermissions(agent, user?._id)

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
    router.push(`/chat/${agent.username}`)
  }

  //const onUpdate = async () => {
  //  const queryClient = getQueryClient()
  //  await queryClient.invalidateQueries({ queryKey })
  //}

  //const handleEditClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
  //  evt.preventDefault()
  //  setIsOpen(false)
  //  dispatch(
  //    updateAgentFormSheet({
  //      isOpen: true,
  //      mode: 'update',
  //      agentId: agent._id,
  //      onAction: onUpdate,
  //    }),
  //  )
  //}

  //const handleConfigureDeployments = (
  //  evt: React.MouseEvent<HTMLButtonElement>,
  //) => {
  //  evt.preventDefault()
  //  setIsOpen(false)
  //  dispatch(
  //    updateAgentDeploymentFormSheet({ isOpen: true, agentId: agent._id }),
  //  )
  //}

  return (
    <ActionsDropdown
      open={isOpen}
      className={className}
      onOpenChange={setIsOpen}
    >
      {isOpen && (
        <>
          <DropdownMenuGroup>
            {!hiddenItems?.includes('view-details') && (
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
            )}
            {!hiddenItems?.includes('chat') && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/chat/${agent.username}`}
                  className="cursor-pointer"
                >
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Chat
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          {!hiddenItems?.includes('share') && (
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <button
                  type="button"
                  className="w-full"
                  onClick={evt => handleShareClick(evt, agent, dispatch)}
                >
                  <Share2Icon className="mr-2 h-4 w-4" />
                  Share
                </button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          {/* {!hiddenItems?.includes('like') && (
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <LikeButton
                  type="agent"
                  id={agent._id}
                  isLiked={agent.isLiked}
                  docQueryKeyId={agent.username}
                  likeCount={agent.likeCount}
                  isDropdownItem={true}
                  disabled={!isSignedIn}
                />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )} */}
          {hasOwnerAccess && !isPermissionsLoading && (
            <>
              {/*isFeatureDeploymentsEnabled &&
                !hiddenItems?.includes('deployments') && (
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
                  </>
                )*/}
              {/*isFeatureDeploymentsEnabled &&
                !hiddenItems?.includes('tasks') && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <button
                        type="button"
                        onClick={handleConfigureTasks}
                        className="w-full"
                      >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        Tasks
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )*/}
              {!hiddenItems?.includes('privacy') && (
                <DropdownMenuGroup>
                  <PrivacyActionItem
                    type="agent"
                    item={agent}
                    queryKey={queryKey}
                  />
                </DropdownMenuGroup>
              )}
              {!hiddenItems?.includes('delete') && (
                <>
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
          {hasEditAccess && !isPermissionsLoading && (
            <>
              {!hiddenItems?.includes('edit') && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  {onEdit ? (
                    <button
                      type="button"
                      className="w-full text-left flex"
                      onClick={evt => {
                        evt.preventDefault()
                        setIsOpen(false)
                        onEdit()
                      }}
                    >
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <Link
                      href={`/edit/${agent.username}`}
                      className="flex w-full"
                    >
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </Link>
                  )}
                </DropdownMenuItem>
              )}
            </>
          )}
        </>
      )}
    </ActionsDropdown>
  )
}

export default AgentActionsMenu
