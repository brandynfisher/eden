import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'

type Props = {
  image?: string,
  name?: string
}
const UserAvatar = ({ image, name }: Props) => {
  return (
    <Avatar className='h-5 w-5 sm:h-6 sm:w-6 group-hover:brightness-105 transition-all'>
      {image ? (
        <AvatarImage asChild src={image}>
          <Image src={image} alt='logo' width={40} height={40} />
        </AvatarImage>
      ) : null}

      {name ? (
        <AvatarFallback
          delayMs={500}
          className='font-bold text-sm bg-foreground text-muted-foreground'>{`${name[0]}${name.slice(-1)}`}
        </AvatarFallback>
      ) : null}
    </Avatar>
  )
}

export default UserAvatar