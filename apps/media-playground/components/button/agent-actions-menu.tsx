'use client'

import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import { updateShareModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent } from '@edenlabs/eden-sdk'
import { ChatBubbleIcon } from '@radix-ui/react-icons'
import { QueryKey } from '@tanstack/react-query'
import { ExternalLinkIcon, Share2Icon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  agent: Agent
  queryKey: QueryKey
  className?: string
}

const AgentActionsMenu = ({ agent, queryKey, className }: Props) => {
  const { user } = useAuthState()
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)

  if (!agent) {
    return null
  }

  const handleShareClick = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/agents/${agent._id}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl: shareUrl,
      }),
    )
  }

  return (
    <ActionsDropdown className={className} onOpenChange={setIsOpen}>
      {isOpen && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/agents/${agent._id}`} prefetch={false}>
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/chat/${agent._id}`}>
                <ChatBubbleIcon className="mr-2 h-4 w-4" />
                Chat
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
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
              <DropdownMenuSeparator />
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
