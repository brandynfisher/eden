import { Creator } from '@edenlabs/eden-sdk'
import { ReactNode } from 'react'
import UserAvatarLink from '@/components/user/user-avatar-link'

type Props = {
  creator?: Creator
  actions?: ReactNode
}

const CardFooter = ({ creator, actions }: Props) => {
  return (
    <div className="flex items-center justify-between h-9 bg-muted text-muted-foreground pl-1">
      <div className="h-7 sm:h-9 w-full flex justify-between items-center">
        {creator ? (
          <UserAvatarLink
            name={creator.username || creator._id}
            image={creator.userImage
          } />
        ) : null}
        <div className="ml-auto flex gap-2">{actions}</div>
      </div>
    </div>
  )
}

export default CardFooter
