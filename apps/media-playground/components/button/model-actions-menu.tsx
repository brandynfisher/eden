import ActionsDropdown from '@/components/button/actions-dropdown'
import DeleteActionItem from '@/components/button/delete-action-item'
import DownloadActionItem from '@/components/button/download-action-item'
import LikeButton from '@/components/button/like-button'
import PrivacyActionItem from '@/components/button/privacy-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useModelQuery } from '@/hooks/query/use-model-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { updateShareModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { generateFilename } from '@/utils/slug.util'
import { ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { ComponentIcon, ExternalLinkIcon, Share2Icon } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

type Props = {
  model: ModelV2
  queryKey: QueryKey
  className?: string
  hiddenItems?: (
    | 'view-details'
    | 'use-model'
    | 'share'
    | 'like'
    | 'privacy'
    | 'delete'
    | 'download'
  )[]
}

const ModelActionsMenu = ({
  model,
  queryKey,
  className,
  hiddenItems,
}: Props) => {
  const { user } = useAuthState()
  const [isOpen, setIsOpen] = useState(false)
  const dispatch = useAppDispatch()

  const { model: modelResponse } = useModelQuery({
    key: model._id,
    initialData: {
      model,
    },
    enabled: !!model,
  })

  if (!model) {
    return null
  }

  const modelData = modelResponse || model

  const handleShareClick = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/models/${model._id}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl,
      }),
    )
  }

  return (
    <ActionsDropdown className={className} onOpenChange={setIsOpen}>
      {isOpen && (
        <>
          <DropdownMenuGroup>
            {!hiddenItems?.includes('view-details') && (
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer"
                  href={`/models/${modelData._id}`}
                >
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
            )}
            {!hiddenItems?.includes('use-model') && (
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer"
                  href={`/create/image/${
                    model.base_model && model.base_model === 'flux-dev'
                      ? 'flux_dev'
                      : 'txt2img'
                  }?lora=${model._id}`}
                  prefetch={false}
                >
                  <ComponentIcon className="mr-2 h-4 w-4" />
                  Use Model
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          {!hiddenItems?.includes('share') && (
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full"
                onClick={handleShareClick}
              >
                <Share2Icon className="mr-2 h-4 w-4" />
                Share
              </button>
            </DropdownMenuItem>
          )}
          {!hiddenItems?.includes('like') && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <LikeButton
                type="model"
                id={modelData._id}
                isLiked={modelData.isLiked}
                likeCount={modelData.likeCount}
                isDropdownItem={true}
              />
            </DropdownMenuItem>
          )}
          {modelData.user._id === user?._id && (
            <>
              {!hiddenItems?.includes('privacy') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <PrivacyActionItem
                      type="model"
                      item={modelData}
                      queryKey={queryKey}
                      // onUpdate={onUpdate || refetchModel}
                    />
                  </DropdownMenuGroup>
                </>
              )}
              {!hiddenItems?.includes('delete') && (
                <>
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
              {!hiddenItems?.includes('download') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DownloadActionItem
                      type="model"
                      originalFileUrl={modelData.checkpoint}
                      saveAsFileName={generateFilename(
                        `${modelData.name.replaceAll('/', '_')}_${
                          modelData._id
                        }`,
                      )}
                    />
                  </DropdownMenuGroup>
                </>
              )}
            </>
          )}
        </>
      )}
    </ActionsDropdown>
  )
}

export default ModelActionsMenu
