import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import DownloadActionItem from '@/components/button/download-action-item'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { ComponentIcon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  model: ModelV2
  queryKey: QueryKey
  className?: string
}

const ModelActionsMenu = ({ model, queryKey, className }: Props) => {
  const { user } = useAuthState()
  const [isOpen, setIsOpen] = useState(false)

  if (!model) {
    return null
  }

  return (
    <ActionsDropdown className={className} onOpenChange={setIsOpen}>
      {isOpen && (
        <ModelActionsContent
          model={model}
          queryKey={queryKey}
          userId={user?._id}
        />
      )}
    </ActionsDropdown>
  )
}

type ContentProps = {
  model: ModelV2
  queryKey: QueryKey
  userId?: string
}

const ModelActionsContent = ({ model, queryKey, userId }: ContentProps) => {
  const { model: modelResponse } = useModelQuery({
    key: model._id,
    initialData: {
      model,
    },
  })

  const modelData = modelResponse || model

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={`/models/${modelData._id}`}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            View Details
            {/*<DropdownMenuShortcut>⇧⌘O</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
        {/*<DropdownMenuItem asChild>*/}
        {/*  <Link href={`/train/model/lora_trainer?task=${model._id}`}>*/}
        {/*    <FileSlidersIcon className="mr-2 h-4 w-4" />*/}
        {/*    Use as Preset*/}
        {/*    <DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>*/}
        {/*  </Link>*/}
        {/*</DropdownMenuItem>*/}
        <DropdownMenuItem asChild>
          <Link href={`/create/image/txt2img?lora=${model._id}`}>
            <ComponentIcon className="mr-2 h-4 w-4" />
            Use Model
            {/*<DropdownMenuShortcut>⇧⌘M</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      {modelData.user._id === userId && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <PrivacyActionItem
              type="model"
              item={modelData}
              queryKey={queryKey}
              // onUpdate={onUpdate || refetchModel}
            />
            <DownloadActionItem
              type="model"
              originalFileUrl={modelData.checkpoint}
              saveAsFileName={modelData.slug.replaceAll('/', '_')}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DeleteActionItem
              type="model"
              item={modelData}
              queryKey={queryKey}
            />
          </DropdownMenuGroup>
        </>
      )}
    </>
  )
}

export default ModelActionsMenu
