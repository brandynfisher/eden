import ActionsDropdown from '@/components/button/actions-dropdown'
import DownloadActionItem from '@/components/button/download-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { useCreationQuery } from '@/hooks/query/use-creation-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { ExternalLinkIcon, FileSlidersIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  creation: CreationV2
  onUpdate?: (item: ModelV2 | CreationV2) => void
  className?: string
}

const CreationActionsMenu = ({ creation, onUpdate, className }: Props) => {
  const { user } = useAuthState()
  const { creation: creationResponse, invalidate: refetchCreation } =
    useCreationQuery({
      key: creation._id,
      initialData: {
        creation,
      },
    })

  const creationData = creationResponse || creation

  if (!creationData) {
    return null
  }

  return (
    <ActionsDropdown className={className}>
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={`/creations/${creationData._id}`}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            View Details
            <DropdownMenuShortcut>⇧⌘O</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/create/${creationData.mediaAttributes?.type}/${creationData.workflow}?creation=${creationData._id}`}
          >
            <FileSlidersIcon className="mr-2 h-4 w-4" />
            Use as Preset
            <DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      {creationData.user._id === user?._id ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <PrivacyActionItem
              type="creation"
              item={creationData}
              onUpdate={onUpdate ? onUpdate : refetchCreation}
            />
            <DownloadActionItem
              type="creation"
              originalFileUrl={creationData.url || ''}
              saveAsFileName={`${creationData.user.username}${
                creationData.args.prompt
                  ? `_${creationData.args.prompt
                      .substring(0, 64)
                      .trim()
                      .replace(/\s+/g, '-')}`
                  : ``
              }_${creationData._id}`}
            />
          </DropdownMenuGroup>
        </>
      ) : null}
    </ActionsDropdown>
  )
}

export default CreationActionsMenu
