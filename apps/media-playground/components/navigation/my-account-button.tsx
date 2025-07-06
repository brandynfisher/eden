'use client'

import RedeemVoucherForm from '@/components/form/redeem-voucher-form'
import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import DialogMenuItem from '@/components/modal/dialog-menu-item'
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
import { useMe } from '@/hooks/use-me'
import { siteConfig } from '@/lib/config'
import { subscriptionTierNameMap } from '@/lib/strings'
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import * as Sentry from '@sentry/nextjs'
import { feedbackIntegration } from '@sentry/nextjs'
import {
  ActivityIcon,
  BookmarkIcon,
  BotIcon,
  ClockIcon,
  ComponentIcon,
  CreditCardIcon,
  ImageIcon,
  LogOutIcon,
  SettingsIcon,
  TicketIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { forwardRef, useRef, useState } from 'react'

const ThemeToggleForwardWrap = forwardRef<HTMLDivElement>(
  ({ ...rest }, ref) => (
    <div ref={ref} className="w-full">
      <ThemeToggle {...rest} label={'Theme'} />
    </div>
  ),
)
ThemeToggleForwardWrap.displayName = 'ThemeToggleForwardWrap'

const AccountDropdown = () => {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const { user, balance } = useMe({
    isAuthenticated: !!isSignedIn,
  })
  const { signOut } = useClerk()

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const logout = async () => {
    if (isSignedIn) {
      await signOut({ redirectUrl: pathname })
    }
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasOpenDialog, setHasOpenDialog] = useState(false)
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null)
  const focusRef = useRef<HTMLButtonElement | null>(null)
  const [feedback, setFeedback] =
    useState<ReturnType<typeof feedbackIntegration>>()
  const feedbackButtonRef = useRef<HTMLDivElement>(null)

  function handleDialogItemSelect() {
    focusRef.current = dropdownTriggerRef.current
  }

  function handleDialogItemOpenChange(open: boolean) {
    setHasOpenDialog(open)
    if (!open) {
      setDropdownOpen(false)
    }
  }

  React.useEffect(() => {
    setFeedback(Sentry.getFeedback())
  }, [])

  React.useEffect(() => {
    let unsubscribe: () => void

    if (feedback && feedbackButtonRef && feedbackButtonRef.current) {
      unsubscribe = feedback.attachTo(feedbackButtonRef.current)
    }

    return () => {
      unsubscribe && unsubscribe()
    }
  }, [feedback])

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={dropdownTriggerRef}
          className="rounded-full group relative z-10 focus:!ring-0"
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
      <DropdownMenuContent
        align="end"
        className="w-60"
        hidden={hasOpenDialog}
        onCloseAutoFocus={event => {
          if (focusRef.current) {
            (focusRef.current as HTMLButtonElement).focus()
            focusRef.current = null
            event.preventDefault()
          }
        }}
      >
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
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link
            href={'/settings/subscription'}
            className="flex items-center justify-between w-full"
          >
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
              <span>{Number((balance || 0).toFixed(0)).toLocaleString()}</span>
              <span className="ml-1 text-muted-foreground/70">manna</span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}`}>
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Creations</span>
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
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}?tab=collections`}>
            <BookmarkIcon className="mr-2 h-4 w-4" />
            <span>Collections</span>
          </Link>
          {/*<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/creators/${user?.username}?tab=agents`}>
            <BotIcon className="mr-2 h-4 w-4" />
            <span>Agents</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isPreviewUser && (
          <>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={`/settings/tasks`}>
                <ClockIcon className="mr-2 h-4 w-4" />
                <span>Tasks</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={`/settings/deployments`}>
                <ActivityIcon className="mr-2 h-4 w-4" />
                <span>Deployments</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/settings/subscription`}>
            <CreditCardIcon className="mr-2 h-4 w-4" />
            <span>Subscription</span>
          </Link>
        </DropdownMenuItem>
        <DialogMenuItem
          onSelect={handleDialogItemSelect}
          onOpenChange={handleDialogItemOpenChange}
          triggerChildren={
            <>
              <TicketIcon className="mr-2 h-4 w-4" />
              <span>Redeem Voucher</span>
            </>
          }
        >
          <RedeemVoucherForm />
        </DialogMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={`/settings/account`}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <ThemeToggleForwardWrap />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
          {/*<DropdownMenuShortcut>⇧Q</DropdownMenuShortcut>*/}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="pl-2">
          <div className="flex items-center w-full">
            <Link
              className="text-xs hover:underline text-muted-foreground"
              href={`https://docs.eden.art/docs/overview/tos`}
              prefetch={false}
            >
              <span>Terms</span>
            </Link>

            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size={'icon'} asChild>
                <Link
                  href={siteConfig.links.discord}
                  target="_blank"
                  className="filter grayscale hover:grayscale-0"
                >
                  <DiscordIcon size={20} />
                </Link>
              </Button>
              <Button variant="ghost" size={'icon'} asChild>
                <Link
                  href={siteConfig.links.twitter}
                  target="_blank"
                  className="group grayscale hover:grayscale-0 hover:text-white"
                >
                  <TwitterIcon
                    size={18}
                    className="brightness-50 group-hover:!brightness-100"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const LoginButton = () => {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  const authenticate = async () => {
    if (!isSignedIn) {
      openSignIn({
        appearance: { baseTheme: dark },
        forceRedirectUrl: pathname,
      })
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
