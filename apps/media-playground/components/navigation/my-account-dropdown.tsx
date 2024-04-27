import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatarLink from '@/components/user/user-avatar-link'
import UserAvatar from '@/components/user/user-avatar'
import CreatorData from '@/stories/dummyData/creator'
import Link from 'next/link'

const MyAccountDropdown = () => {
  // @todo: replace with fetched (authed) data from /api/me
  const user = CreatorData

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full group" size="icon" variant="secondary">
          <UserAvatar image={user.userImage} name={user.username}/>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        {/*<DropdownMenuSeparator />*/}
        <DropdownMenuItem className="cursor-pointer" asChild>
          <UserAvatarLink image={user.userImage} name={user.username || user.userId} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user.username}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/account/settings/general`}>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/account/settings/subscription`}>Subscription</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MyAccountDropdown