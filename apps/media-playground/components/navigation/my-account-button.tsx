'use client'

import FeedbackForm from '@/components/form/feedback-form'
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
import { useNotificationContext } from '@/providers/notification-provider'
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import {
  ActivityIcon,
  BookmarkIcon,
  BotIcon,
  ClockIcon,
  ComponentIcon,
  CreditCardIcon,
  ImageIcon,
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
  TicketIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const { user, balance } = useMe({
    isAuthenticated: !!isSignedIn,
  })
  const { signOut } = useClerk()
  const { unreadCount } = useNotificationContext()

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const logout = async () => {
    if (isSignedIn) {
      await signOut()
      window.location.href = '/'
    }
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasOpenDialog, setHasOpenDialog] = useState(false)
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null)
  const focusRef = useRef<HTMLButtonElement | null>(null)
  function handleDialogItemSelect() {
    focusRef.current = dropdownTriggerRef.current
  }

  function handleDialogItemOpenChange(open: boolean) {
    setHasOpenDialog(open)
    if (!open) {
      setDropdownOpen(false)
    }
  }

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
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[11px] font-semibold leading-none text-white shadow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
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
              <Link
                href="/sessions"
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  <span>Sessions</span>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  BETA
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={`/settings/tasks`}>
                <ClockIcon className="mr-2 h-4 w-4" />
                <span>Tasks</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={`/settings/integrations`}>
                <ActivityIcon className="mr-2 h-4 w-4" />
                <span>Integrations</span>
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
              <MessageSquareIcon className="mr-2 h-4 w-4" />
              <span>Send Feedback</span>
            </>
          }
        >
          <FeedbackForm />
        </DialogMenuItem>
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
              href={`https://docs.eden.art/legal/tos`}
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
