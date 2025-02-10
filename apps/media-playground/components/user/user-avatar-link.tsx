import UserAvatar from '@/components/user/user-avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import Link from 'next/link'

export type UserAvatarLinkProps = {
  name: string
  image?: string
  hideName?: boolean
  isAgent?: boolean
}

const UserAvatarLink = ({
  name,
  image,
  hideName,
  isAgent,
}: UserAvatarLinkProps) => {
  return (
    <Link
      href={`/${isAgent ? 'agents' : 'creators'}/${name}`}
      className="group flex gap-2 items-center cursor-pointer"
    >
      {/* <UserAvatar image={getCloudfrontOriginalUrl(image)} name={name} className="h-8 w-8" /> */}
      <UserAvatar
        image={getCloudfrontOriginalUrl(image)}
        name={name}
        className="h-8 w-8"
      />
      {!hideName ? (
        <div className="group-hover:text-primary transition-colors">{name}</div>
      ) : null}
    </Link>
  )
}

export default UserAvatarLink
