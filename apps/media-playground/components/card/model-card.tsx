import ToolsButton from '@/components/button/tools-button'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import { fetcher } from '@/lib/fetcher'
import { Creator, ModelV2, ModelsV2PatchResponse } from '@edenlabs/eden-sdk'
import { LockClosedIcon } from '@radix-ui/react-icons'
import { LockOpenIcon, SquareMousePointerIcon } from 'lucide-react'
import Link from 'next/link'
import React, { CSSProperties } from 'react'
import { toast } from 'sonner'

type Props = {
  model: ModelV2
  linkHref: string
  creator?: Creator
  showFooter?: boolean
  style?: CSSProperties
  onUpdate?: (item: ModelV2) => void
  onClick?: (id: string) => void
}

const ModelCard = ({ model, showFooter, style, onUpdate, onClick }: Props) => {
  const { user } = useAuthState()
  const { user: creator } = model || {}

  const onTogglePublic = async () => {
    try {
      const response: ModelsV2PatchResponse = await fetcher(
        `/api/models/${model._id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            public: !model.public,
          }),
        },
      )

      if (!response) {
        console.error('response empty')
        return
      }

      if (!response.model) {
        console.error('model empty')
        return
      }

      onUpdate && onUpdate(response.model)

      toast.success(`Model updated`, {
        description: `set to ${model.public ? 'private' : 'public'}`,
        dismissible: true,
        richColors: true,
      })
    } catch (e) {
      toast.error(`Update Error`, {
        description: 'Failed to toggle model privacy',
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <Card
      className="overflow-hidden border-0 z-10 transition-shadow hover:shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
      style={style}
    >
      {onClick ? (
        <Button
          size="sm"
          variant="outline"
          className="flex items-center"
          onClick={() => onClick(model._id)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          Select
        </Button>
      ) : null}
      <Link
        href={`/models/${model._id}`}
        prefetch={false}
        className="relative w-full block"
      >
        <CardImage
          media={{
            url: model.thumbnail,
            thumbnail: model.thumbnail,
            width: 256,
            height: 256,
            type: 'image',
          }}
        />
      </Link>
      {showFooter ? (
        <CardFooter
          // creator={creator}
          actions={[
            // <LikeButton
            //   key={0}
            //   count={4}
            //   isActive={false}
            //   onChange={() => null}
            // />,
            <ToolsButton key={1}>
              {creator._id === user?._id ? (
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={onTogglePublic}
                    className="cursor-pointer"
                  >
                    {model.public ? (
                      <LockClosedIcon className="mr-2 h-4 w-4" />
                    ) : (
                      <LockOpenIcon className="mr-2 h-4 w-4" />
                    )}
                    <span>
                      Set <strong>{model.public ? 'Private' : 'Public'}</strong>
                    </span>
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              ) : null}
            </ToolsButton>,
          ]}
        >
          <div className="text-xs">{model.name}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export default ModelCard
