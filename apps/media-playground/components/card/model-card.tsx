// import LikeButton from '@/components/button/like-button'
import ModelActionsMenu from '@/components/button/model-actions-menu'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import PrivateIcon from '@/components/icons/private-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Creator, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { PlayIcon } from 'lucide-react'
import Link from 'next/link'
import React, { CSSProperties } from 'react'

type Props = {
  model: ModelV2
  linkHref: string
  creator?: Creator
  showFooterItems?: {
    name: boolean
    actions: boolean
  }
  style?: CSSProperties
  queryKey: QueryKey
  onClick?: (item: ModelV2) => void
  isSelectable?: boolean
  isSelected?: boolean
  variant?: 'default' | 'creation-page'
}

const ModelCard = ({
  model,
  showFooterItems = { name: true, actions: true },
  style,
  queryKey,
  onClick,
  isSelectable,
  isSelected,
  variant = 'default',
}: Props) => {
  const hideFooter = !showFooterItems.name && !showFooterItems.actions
  const isCreationPageVariant = variant === 'creation-page'

  if (isCreationPageVariant) {
    return (
      <Card
        className={cn([
          'relative overflow-hidden border-0 z-10 group',
          isSelectable &&
            !isSelected &&
            'hover:border-2 hover:border-primary transition-all',
        ])}
        style={style}
      >
        {!model.public ? (
          <PrivateIcon className="absolute right-2 top-2 pointer-events-none z-20" />
        ) : null}
        {isSelectable && !isSelected ? (
          <div
            className="absolute inset-0 cursor-pointer z-50"
            onClick={() => onClick?.(model)}
          />
        ) : null}
        {isSelected ? (
          <div className="absolute z-50 inset-0 flex items-center justify-center w-full h-full">
            <div className="flex items-center justify-center bg-black px-2 py-1 rounded-md text-white text-sm">
              Already Selected
            </div>
          </div>
        ) : null}
        <Link
          href={`/models/${model._id}`}
          prefetch={false}
          className="relative w-full block group"
          onClick={() => onClick?.(model)}
        >
          <CardImage
            className="rounded-md"
            media={{
              url: model.thumbnail ?? undefined,
              thumbnail: model.thumbnail,
              width: 256,
              height: 256,
              type: 'image',
            }}
          />
        </Link>
        {/* Creation count and play button overlay - styled like like button */}
        <div className="absolute bottom-2 right-2 z-10 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            className="cursor-pointer"
            href={`/create/image/${
              model.base_model && model.base_model === 'flux-dev'
                ? 'flux_dev'
                : 'txt2img'
            }?lora=${model._id}`}
            onClick={e => e.stopPropagation()}
          >
            <Button
              className="h-10 px-3 bg-black/75 hover:bg-black/90 text-white border-0 backdrop-blur-sm rounded-full shadow-lg"
              size="sm"
              variant="outline"
              type="button"
            >
              <PlayIcon className="h-4 w-4 mr-1.5" />
              {model.creationCount || 0}
            </Button>
          </Link>
        </div>
        {/* Mobile version - always visible */}
        <div className="bg-background p-2 rounded-b-lg border border-t-0 md:hidden flex justify-end">
          <Link
            className="cursor-pointer"
            href={`/create/image/${
              model.base_model && model.base_model === 'flux-dev'
                ? 'flux_dev'
                : 'txt2img'
            }?lora=${model._id}`}
            onClick={e => e.stopPropagation()}
          >
            <Button
              className="h-8 px-2 bg-black/75 hover:bg-black/90 text-white border-0"
              size="sm"
              variant="outline"
              type="button"
            >
              <PlayIcon className="h-3 w-3 mr-1" />
              {model.creationCount || 0}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn([
        'group relative overflow-hidden transition-all duration-300',
        isSelectable &&
          !isSelected &&
          'cursor-pointer hover:border-2 hover:border-primary',
        !isSelectable && 'hover:border-primary/50',
        isSelected &&
          'border-primary/50 opacity-50 cursor-not-allowed pointer-events-none',
      ])}
      style={style}
    >
      {!model.public ? <PrivateIcon /> : null}
      {isSelectable && !isSelected ? (
        <div
          className="absolute inset-0 cursor-pointer z-50"
          onClick={() => onClick?.(model)}
        />
      ) : null}
      {isSelected ? (
        <div className="absolute z-50 inset-0 flex items-center justify-center w-full h-full">
          <div className="flex items-center justify-center bg-black px-2 py-1 rounded-md text-white text-sm">
            Already Selected
          </div>
        </div>
      ) : null}
      <Link
        href={`/models/${model._id}`}
        prefetch={false}
        className="relative w-full block p-4 border-b-0 bg-accent"
        onClick={() => onClick?.(model)}
      >
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <Badge variant="secondary" className="text-xs bg-opacity-80">
            {model.base_model}
          </Badge>
        </div>
        <CardImage
          className="rounded-md"
          media={{
            url: model.thumbnail ?? undefined,
            thumbnail: model.thumbnail,
            width: 256,
            height: 256,
            type: 'image',
          }}
        />
      </Link>
      {!hideFooter && (
        <CardFooter
          // creator={creator}
          actions={
            showFooterItems.actions
              ? [
                  // <LikeButton
                  //   key={0}
                  //   type="model"
                  //   id={model._id}
                  //   isLiked={model.isLiked}
                  //   likeCount={model.likeCount}
                  //   disabled={!isSignedIn}
                  // />,
                  <Link
                    key={2}
                    className="cursor-pointer"
                    href={`/create/image/${
                      model.base_model && model.base_model === 'flux-dev'
                        ? 'flux_dev'
                        : 'txt2img'
                    }?lora=${model._id}`}
                  >
                    <Button
                      className="w-9 h-9 p-2"
                      size="icon"
                      variant="outline"
                      type="button"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </Button>
                  </Link>,
                  <ModelActionsMenu
                    key={1}
                    queryKey={queryKey}
                    model={model}
                    hiddenItems={['like']}
                  />,
                ]
              : []
          }
        >
          {showFooterItems.name && (
            <div className="flex flex-col gap-1">
              <div className="text-xs truncate">{model.name}</div>
              {model.creationCount !== undefined && (
                <div className="text-xs text-muted-foreground">
                  {model.creationCount}{' '}
                  {model.creationCount === 1 ? 'creation' : 'creations'}
                </div>
              )}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export default ModelCard
