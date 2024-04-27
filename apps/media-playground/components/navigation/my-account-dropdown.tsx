'use client'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/user/user-avatar'
import CreatorData from '@/stories/dummyData/creator'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { forwardRef } from 'react'

const ThemeToggleForwardWrap = forwardRef<HTMLDivElement>(({ ...rest }, ref) => (
  <div ref={ref} className="w-full">
    <ThemeToggle {...rest} label={"Theme"} />
  </div>
));
ThemeToggleForwardWrap.displayName = 'ThemeToggleForwardWrap'

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
        <DropdownMenuItem className="cursor-pointer group" asChild>
          <Link href={`/creators/${user.username}`} className="group flex gap-2 items-center cursor-pointer">
            <UserAvatar image={user.userImage} name={user.username}/>
            <div className="group-hover:text-primary text-xs transition-colors">{user.username}</div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user.username}`}>My Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user.username}/models`}>Models</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user.username}/collections`}>Collections</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/account/settings/general`}>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/account/settings/subscription`}>Subscription</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <ThemeToggleForwardWrap />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MyAccountDropdown