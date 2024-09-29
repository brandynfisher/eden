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
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { subscriptionTierNameMap } from '@/lib/strings'
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ComponentIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { forwardRef } from 'react'

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
  const { isSignedIn } = useAuth()

  const { user, balance } = useMe({ isAuthenticated: !!isSignedIn })
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
        <Button
          className="rounded-full group relative z-10 shadow-[0_0px_2px_0_#030712,0_0px_1px_-1px_#030712]"
          size="icon"
          variant="secondary"
        >
          <UserAvatar
            image={user?.userImage}
            name={user?.username}
            className="w-10 h-10"
          />
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {/*<DropdownMenuLabel>My Account</DropdownMenuLabel>*/}
        {/*<DropdownMenuSeparator />*/}
        <DropdownMenuItem className="cursor-pointer group" asChild>
          <Link
            href={`/creators/${user?.username}`}
            className="group flex gap-2 items-center cursor-pointer "
          >
            <UserAvatar
              image={user?.userImage}
              name={user?.username}
              className="h-8 w-8"
            />
            <div className="flex flex-col justify-center min-w-0">
              <div className="group-hover:text-primary text-xs transition-colors">
                {user?.username}
              </div>
              {user?.email ? (
                <span className="text-xs text-muted-foreground/70 truncate">
                  {user?.email}
                </span>
              ) : null}
            </div>
          </Link>
          {/*<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="flex items-center justify-between w-full">
            <div className="capitalize text-xs">
              <span>
                {
                  subscriptionTierNameMap[
                    user?.subscriptionTier || SubscriptionTier.Free
                  ]
                }
              </span>
              <span className="ml-1 text-muted-foreground/70">plan</span>
            </div>
            <div className="text-xs">
              <span>{balance}</span>
              <span className="ml-1 text-muted-foreground/70">manna</span>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}`}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
          {/*<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}?tab=models`}>
            <ComponentIcon className="mr-2 h-4 w-4" />
            <span>Models</span>
          </Link>
          {/*<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        {/*<DropdownMenuItem className="cursor-pointer" asChild>*/}
        {/*  <Link href={`/creators/${user?.username}?tab=collections`}>*/}
        {/*    Collections*/}
        {/*  </Link>*/}
        {/*  /!*<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>*!/*/}
        {/*</DropdownMenuItem>*/}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/settings/account`}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        {/*<DropdownMenuItem className="cursor-pointer" asChild>*/}
        {/*  <Link href={`/settings/subscription`}>*/}
        {/*    <CreditCardIcon className="mr-2 h-4 w-4" />*/}
        {/*    <span>Subscription</span>*/}
        {/*    /!*<DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>*!/*/}
        {/*  </Link>*/}
        {/*</DropdownMenuItem>*/}
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
  // @todo: this is a stupid way to enforce the hook to run everywhere
  const { isSignedIn } = useAuthState()

  return (
    <>
      <VisuallyHidden>isSignedIn: {JSON.stringify(isSignedIn)}</VisuallyHidden>
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
