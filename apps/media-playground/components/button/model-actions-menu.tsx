import ActionsDropdown from '@/components/button/actions-dropdown'
import DownloadActionItem from '@/components/button/download-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { CreationV2, ModelV2 } from '@edenlabs/eden-sdk'
import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  model: ModelV2
  onUpdate?: (item: ModelV2 | CreationV2) => void
  className?: string
}

const ModelActionsMenu = ({ model, onUpdate, className }: Props) => {
  const { user } = useAuthState()
  const { model: modelResponse, invalidate: refetchModel } = useModelQuery({
    key: model._id,
    initialData: {
      model,
    },
  })

  const modelData = modelResponse || model

  if (!modelData) {
    return null
  }

  return (
    <ActionsDropdown className={className}>
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={`/models/${modelData._id}`}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            View Details
            <DropdownMenuShortcut>⇧⌘O</DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      {modelData.user._id === user?._id ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <PrivacyActionItem
              type="model"
              item={modelData}
              onUpdate={onUpdate ? onUpdate : refetchModel}
            />
            <DownloadActionItem
              type="model"
              originalFileUrl={modelData.checkpoint}
              saveAsFileName={modelData.slug.replaceAll('/', '_')}
            />
          </DropdownMenuGroup>
        </>
      ) : null}
    </ActionsDropdown>
  )
}

export default ModelActionsMenu
