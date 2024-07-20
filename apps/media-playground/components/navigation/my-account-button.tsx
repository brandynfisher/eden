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
import { useCreatorQuery } from '@/hooks/query/use-me-query'
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const { user } = useCreatorQuery({ key: 'me' })

  // @todo: abstract all of this away
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()

  // move this to user state/provider of some sort - analog to garden
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
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}`}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}/models`}>Models</Link>
        </DropdownMenuItem>
        {/*<DropdownMenuItem className="cursor-pointer" asChild>*/}
        {/*  <Link href={`/creators/${user.username}/collections`}>*/}
        {/*    Collections*/}
        {/*  </Link>*/}
        {/*</DropdownMenuItem>*/}
        <DropdownMenuSeparator />
        {/*<DropdownMenuItem className="cursor-pointer" asChild>*/}
        {/*  <Link href={`/settings/account`}>Settings</Link>*/}
        {/*</DropdownMenuItem>*/}
        {/*<DropdownMenuItem className="cursor-pointer" asChild>*/}
        {/*  <Link href={`/settings/subscription`}>Subscription</Link>*/}
        {/*</DropdownMenuItem>*/}
        <DropdownMenuItem className="cursor-pointer" asChild>
          <ThemeToggleForwardWrap />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          Logout
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
