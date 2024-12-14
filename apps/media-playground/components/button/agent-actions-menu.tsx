import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  agent: Agent
  queryKey: QueryKey
  className?: string
}

const AgentActionsMenu = ({ agent, queryKey, className }: Props) => {
  const { user } = useAuthState()
  const [isOpen, setIsOpen] = useState(false)

  if (!agent) {
    return null
  }

  return (
    <ActionsDropdown className={className} onOpenChange={setIsOpen}>
      {isOpen && (
        <>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/assistants/${agent._id}`}>
                <ExternalLinkIcon className="mr-2 h-4 w-4" />
                View Details
              </Link>
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
