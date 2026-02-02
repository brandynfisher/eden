import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import customImageLoader from '@/image-loader'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type Props = {
  image?: string
  name?: string
  className?: string
}
const UserAvatar = ({ image, name, className }: Props) => {
  // Check if the URL is from CloudFront, S3, or Clerk (external URLs that shouldn't use custom loader)
  const isExternalUrl = Boolean(
    image &&
      (image.includes('cloudfront.net') ||
        image.includes('s3.amazonaws.com') ||
        image.includes('clerk.') ||
        image.includes('img.clerk.com')),
  )

  return (
    <Avatar
      className={cn(
        'group-hover:brightness-105 transition-all flex items-center',
        className,
      )}
    >
      {image ? (
        <Image
          loader={isExternalUrl ? undefined : customImageLoader}
          src={image}
          alt="logo"
          quality={100}
          width={64}
          height={64}
          unoptimized={isExternalUrl}
          className="group-hover:brightness-105"
        />
      ) : null}

      {!image && !name ? (
        <Skeleton className="absolute inset-0 w-full h-full rounded-full overflow-hidden" />
      ) : null}

      {!image && name ? (
        <AvatarFallback
          delayMs={1250}
          className="font-bold text-sm text-muted-foreground"
        >
          {`${name[0]}${name.slice(-1)}`}
        </AvatarFallback>
      ) : null}
    </Avatar>
  )
}

export default UserAvatar
