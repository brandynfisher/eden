import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Creator } from '@edenlabs/eden-sdk'
import { ReactNode } from 'react'

type Props = {
  creator?: Creator
  actions?: ReactNode
}

const CardFooter = ({ creator, actions }: Props) => {
  return (
    <div className="flex items-center justify-between h-9 bg-muted text-muted-foreground pl-1">
      <div className="h-7 sm:h-9 w-full flex justify-between items-center">
        {creator ? (
          <div className="flex gap-2 items-center">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-foreground">CN</AvatarFallback>
            </Avatar>
            <div className="text-xs">{creator.username}</div>
          </div>
        ) : null}
        <div className="ml-auto flex gap-2">{actions}</div>
      </div>
    </div>
  )
}

export default CardFooter
