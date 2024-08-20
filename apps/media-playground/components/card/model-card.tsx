// import LikeButton from '@/components/button/like-button'
import ToolsButton from '@/components/button/tools-button'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import { Card } from '@/components/ui/card'
import { Creator, ModelV2 } from '@edenlabs/eden-sdk'
import Link from 'next/link'
import React, { CSSProperties } from 'react'

type Props = {
  model: ModelV2
  linkHref: string
  creator?: Creator
  showFooter?: boolean
  style?: CSSProperties
}

const ModelCard = ({ model, showFooter, style }: Props) => {
  return (
    <Card
      className="overflow-hidden border-0 z-10 transition-shadow hover:shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
      style={style}
    >
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
            <ToolsButton key={1} />,
          ]}
        >
          <div className="text-xs">{model.name}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export default ModelCard
