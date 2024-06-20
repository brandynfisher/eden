import UserAvatar from '@/components/user/user-avatar'
import Link from 'next/link'

export type UserAvatarLinkProps = {
  name: string
  image?: string
  hideName?: boolean
}

const UserAvatarLink = ({ name, image, hideName }: UserAvatarLinkProps) => {
  return (
    <Link
      href={`/creators/${name}`}
      className="group flex gap-2 items-center cursor-pointer"
    >
      <UserAvatar image={image} name={name} />
      {!hideName ? (
        <div className="group-hover:text-primary text-xs transition-colors">
          {name}
        </div>
      ) : null}
    </Link>
  )
}

export default UserAvatarLink
