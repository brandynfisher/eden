import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type Props = {
  image?: string
  name?: string
  variant?: 'small' | 'large'
}
const UserAvatar = ({ image, name, variant = 'small' }: Props) => {
  return (
    <Avatar
      className={cn(
        'group-hover:brightness-105 transition-all ',
        variant === 'small'
          ? 'h-5 w-5 sm:h-6 sm:w-6'
          : 'h-9 w-9 group-hover:scale-110',
      )}
    >
      {image ? (
        <AvatarImage asChild src={image}>
          <Image src={image} alt="logo" width={40} height={40} />
        </AvatarImage>
      ) : (
        <Skeleton className="absolute inset-0 w-full h-full rounded-full overflow-hidden" />
      )}

      {name ? (
        <AvatarFallback
          delayMs={500}
          className="font-bold text-sm text-muted-foreground"
        >
          {`${name[0]}${name.slice(-1)}`}
        </AvatarFallback>
      ) : null}
    </Avatar>
  )
}

export default UserAvatar
