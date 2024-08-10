'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/user/user-avatar'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { CreditCardIcon, LogOutIcon, SettingsIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { forwardRef } from 'react'
import * as React from 'react'

const ThemeToggleForwardWrap = forwardRef<HTMLDivElement>(
  ({ ...rest }, ref) => (
    <div ref={ref} className="w-full">
      <ThemeToggle {...rest} label={'Theme'} />
    </div>
  ),
)
ThemeToggleForwardWrap.displayName = 'ThemeToggleForwardWrap'
const AccountDropdown = () => {
  const router = useRouter()
  const { creator: user } = useCreatorQuery({ key: 'me' })
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()

  const logout = async () => {
    if (isSignedIn) {
      await signOut()
    }
    router.push('/sign-in')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full group" size="icon" variant="secondary">
          <UserAvatar
            image={user?.userImage}
            name={user?.username}
            variant="large"
          />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/*<DropdownMenuLabel>My Account</DropdownMenuLabel>*/}
        {/*<DropdownMenuSeparator />*/}
        <DropdownMenuItem className="cursor-pointer group" asChild>
          <Link
            href={`/creators/${user?.username}`}
            className="group flex gap-2 items-center cursor-pointer"
          >
            <UserAvatar image={user?.userImage} name={user?.username} />
            <div className="group-hover:text-primary text-xs transition-colors">
              {user?.username}
            </div>
          </Link>
          {/*<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}`}>Profile</Link>
          {/*<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}?tab=models`}>Models</Link>
          {/*<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}?tab=collections`}>
            Collections
          </Link>
          {/*<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/settings/account`}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
          {/*  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/settings/subscription`}>
            <CreditCardIcon className="mr-2 h-4 w-4" />
            <span>Subscription</span>
            {/*<DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <ThemeToggleForwardWrap />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
          {/*<DropdownMenuShortcut>⇧Q</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const LoginButton = () => {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const { theme } = useTheme()
  const clerkTheme = theme === 'dark' ? dark : undefined

  const authenticate = async () => {
    if (!isSignedIn) {
      openSignIn(
        clerkTheme ? { appearance: { baseTheme: clerkTheme } } : undefined,
      )
    }
  }

  return <Button onClick={authenticate}>Login</Button>
}

const MyAccountButton = () => {
  return (
    <>
      <SignedIn>
        <AccountDropdown />
      </SignedIn>
      <SignedOut>
        <LoginButton />
      </SignedOut>
    </>
  )
}

export default MyAccountButton
