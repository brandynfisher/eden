import ModelActionsMenu from '@/components/button/model-actions-menu'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import { Card } from '@/components/ui/card'
import { Creator, ModelV2 } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { LockIcon, SquareMousePointerIcon } from 'lucide-react'
import Link from 'next/link'
import React, { CSSProperties } from 'react'

type Props = {
  model: ModelV2
  linkHref: string
  creator?: Creator
  showFooter?: boolean
  style?: CSSProperties
  queryKey: QueryKey
  onClick?: (item: ModelV2) => void
}

const ModelCard = ({ model, showFooter, style, queryKey, onClick }: Props) => {
  return (
    <Card
      className="relative overflow-hidden border-0 z-10 transition-shadow hover:shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712] group"
      style={style}
    >
      {!model.public ? (
        <LockIcon className="absolute h-4 w-4 right-3 top-3.5 text-white [@media(pointer:coarse)]:right-2 [@media(pointer:coarse)]:top-2.5 bg-gray-300 bg-opacity-20 rounded-sm p-0.5 drop-shadow backdrop-blur-[2px] z-20" />
      ) : null}
      {onClick ? (
        <div
          className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer hover:ring-2 ring-offset-1 ring-primary-foreground z-50 opacity-0 bg-popover group-hover:opacity-50 [@media(pointer:coarse)]:opacity-50 transition-all"
          onClick={() => onClick(model)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          Select
        </div>
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
            <ModelActionsMenu key={1} queryKey={queryKey} model={model} />,
          ]}
        >
          <div className="text-xs">{model.name}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export default ModelCard
