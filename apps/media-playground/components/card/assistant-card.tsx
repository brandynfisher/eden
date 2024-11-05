import AssistantActionsMenu from '@/components/button/assistant-actions-menu'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import PrivateIcon from '@/components/icons/private-icon'
import { Card } from '@/components/ui/card'
import { Agent } from '@edenlabs/eden-sdk'
import { QueryKey } from '@tanstack/react-query'
import { SquareMousePointerIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  assistant: Agent
  queryKey: QueryKey
  onClick?: (item: Agent) => void
}

const AssistantCard = ({ assistant, queryKey, onClick }: Props) => {
  return (
    <Card className="relative overflow-hidden border-0 z-10 transition-shadow group">
      {!assistant.public ? <PrivateIcon /> : null}
      {onClick ? (
        <div
          className="absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer hover:ring-2 ring-offset-1 ring-primary-foreground z-50 opacity-0 bg-popover group-hover:opacity-50 [@media(pointer:coarse)]:opacity-50 transition-all"
          onClick={() => onClick(assistant)}
        >
          <SquareMousePointerIcon className="mr-2 h-4 w-4" />
          Select
        </div>
      ) : null}
      <Link
        href={`/assistants/${assistant._id}`}
        prefetch={false}
        className="relative w-full block aspect-square"
      >
        <CardImage
          media={{
            url: assistant.image,
            thumbnail: assistant.image,
            width: 512,
            height: 512,
            type: 'image',
            blur: assistant.blurhash,
          }}
          className="object-cover"
        />
      </Link>
      <CardFooter
        actions={[
          <AssistantActionsMenu
            key={1}
            assistant={assistant}
            queryKey={queryKey}
          />,
        ]}
      >
        <div className="text-xs">{assistant.name}</div>
      </CardFooter>
    </Card>
  )
}

export default AssistantCard
