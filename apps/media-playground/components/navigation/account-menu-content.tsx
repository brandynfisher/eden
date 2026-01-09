'use client'

import FeedbackForm from '@/components/form/feedback-form'
import RedeemVoucherForm from '@/components/form/redeem-voucher-form'
import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import DialogMenuItem from '@/components/modal/dialog-menu-item'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/user/user-avatar'
import { siteConfig } from '@/lib/config'
import { subscriptionTierNameMap } from '@/lib/strings'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { DropdownMenuContentProps } from '@radix-ui/react-dropdown-menu'
import {
  ActivityIcon,
  BookmarkIcon,
  BotIcon,
  ClockIcon,
  ComponentIcon,
  ImageIcon,
  LogOutIcon,
  MessageSquareIcon,
  PencilIcon,
  TicketIcon,
} from 'lucide-react'
import Link from 'next/link'
import { RefObject, forwardRef, useRef, useState } from 'react'

type AccountMenuContentProps = {
  user?: {
    username?: string | null
    email?: string | null
    userImage?: string | null
    subscriptionTier?: SubscriptionTier | null
    featureFlags?: FeatureFlag[] | null
  }
  balance?: number | null
  isPreviewUser?: boolean
  onLogout: () => void | Promise<void>
  onOpenSettings?: (tab?: string) => void
  setDropdownOpen: (open: boolean) => void
  triggerRef?: RefObject<HTMLButtonElement | null>
  side?: DropdownMenuContentProps['side']
  align?: DropdownMenuContentProps['align']
}

const ThemeToggleForwardWrap = forwardRef<HTMLDivElement>(
  ({ ...rest }, ref) => (
    <div ref={ref} className="w-full">
      <ThemeToggle {...rest} label={'Theme'} />
    </div>
  ),
)
ThemeToggleForwardWrap.displayName = 'ThemeToggleForwardWrap'

const AccountMenuContent = ({
  user,
  balance,
  isPreviewUser = false,
  onLogout,
  onOpenSettings,
  setDropdownOpen,
  triggerRef,
  side,
  align,
}: AccountMenuContentProps) => {
  const [redeemVoucherOpen, setRedeemVoucherOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const focusRef = useRef<HTMLButtonElement | null>(null)
  const hasOpenDialog = redeemVoucherOpen || feedbackOpen

  function handleDialogItemSelect() {
    focusRef.current = triggerRef?.current ?? null
  }

  const handleDialogItemOpenChange =
    (setOpen: (open: boolean) => void) => (open: boolean) => {
      setOpen(open)
      if (!open) {
        setDropdownOpen(false)
      }
    }

  const closeRedeemVoucherDialog = () => {
    setRedeemVoucherOpen(false)
    setDropdownOpen(false)
  }

  const openSettingsTab = (tab?: string) => {
    onOpenSettings?.(tab)
    setDropdownOpen(false)
  }

  return (
    <DropdownMenuContent
      side={side}
      align={align}
      className="w-60"
      hidden={hasOpenDialog}
      onCloseAutoFocus={event => {
        if (focusRef.current) {
          focusRef.current.focus()
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
            image={user?.userImage || undefined}
            name={user?.username || undefined}
            className="h-8 w-8"
          />
          <div className="flex flex-col justify-center min-w-0">
            <div className="group-hover:text-primary text-xs transition-colors">
              {user?.username}
            </div>
            {user?.email ? (
              <span className="text-xs text-muted-foreground/70 truncate">
                {user.email}
              </span>
            ) : null}
          </div>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem
        className="cursor-pointer hover:bg-purple-500/10"
        onSelect={() => openSettingsTab('subscription')}
      >
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
            <span>{Number((balance || 0).toFixed(0)).toLocaleString()}</span>
            <span className="ml-1 text-muted-foreground/70">manna</span>
          </div>
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer" asChild>
        <Link href={`/creators/${user?.username}`}>
          <ImageIcon className="mr-2 h-4 w-4" />
          <span>Creations</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer" asChild>
        <Link href={`/creators/${user?.username}?tab=models`}>
          <ComponentIcon className="mr-2 h-4 w-4" />
          <span>Models</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer" asChild>
        <Link href={`/creators/${user?.username}?tab=collections`}>
          <BookmarkIcon className="mr-2 h-4 w-4" />
          <span>Collections</span>
        </Link>
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
            <Link href="/sessions">
              <MessageSquareIcon className="mr-2 h-4 w-4" />
              <span>Sessions</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => openSettingsTab('tasks')}
          >
            <ClockIcon className="mr-2 h-4 w-4" />
            <span>Tasks</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => openSettingsTab('integrations')}
          >
            <ActivityIcon className="mr-2 h-4 w-4" />
            <span>Integrations</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}

      <DialogMenuItem
        onSelect={handleDialogItemSelect}
        onOpenChange={handleDialogItemOpenChange(setRedeemVoucherOpen)}
        open={redeemVoucherOpen}
        triggerChildren={
          <>
            <TicketIcon className="mr-2 h-4 w-4" />
            <span>Redeem Voucher</span>
          </>
        }
      >
        <RedeemVoucherForm onSuccess={closeRedeemVoucherDialog} />
      </DialogMenuItem>

      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={() => openSettingsTab('account')}
      >
        <PencilIcon className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer" asChild>
        <ThemeToggleForwardWrap />
      </DropdownMenuItem>

      <DialogMenuItem
        onSelect={handleDialogItemSelect}
        onOpenChange={handleDialogItemOpenChange(setFeedbackOpen)}
        open={feedbackOpen}
        triggerChildren={
          <>
            <MessageSquareIcon className="mr-2 h-4 w-4" />
            <span>Send Feedback</span>
          </>
        }
      >
        <FeedbackForm />
      </DialogMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer" onClick={onLogout}>
        <LogOutIcon className="mr-2 h-4 w-4" />
        <span>Log out</span>
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
  )
}

export default AccountMenuContent
