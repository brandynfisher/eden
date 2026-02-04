'use client'

import AccountMenuContent from '@/components/navigation/account-menu-content'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/user/user-avatar'
import { UserSettingsModal } from '@/features/account/user-settings-modal'
import { hasPreviewAccess } from '@/hooks/use-gated-resource'
import { useMe } from '@/hooks/use-me'
import { useNativeWebview } from '@/hooks/use-native-webview'
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

const AccountDropdown = () => {
  const { isSignedIn } = useAuth()
  const { user, balance } = useMe({
    isAuthenticated: !!isSignedIn,
  })
  const { signOut } = useClerk()

  const isNativeWebview = useNativeWebview()

  const isPreviewUser = hasPreviewAccess(user?.featureFlags)

  const logout = async () => {
    if (isSignedIn) {
      await signOut()

      if (isNativeWebview) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'LOGOUT',
          }),
        )
      }

      window.location.href = '/'
    }
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsModalInitialTab, setSettingsModalInitialTab] =
    useState('account')

  const openSettings = (tab = 'account') => {
    setSettingsModalInitialTab(tab)
    setSettingsModalOpen(true)
  }

  return (
    <>
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

        <AccountMenuContent
          user={user ?? undefined}
          balance={balance}
          isPreviewUser={isPreviewUser}
          onLogout={logout}
          onOpenSettings={openSettings}
          setDropdownOpen={setDropdownOpen}
          triggerRef={dropdownTriggerRef}
          align="end"
        />
      </DropdownMenu>

      {settingsModalOpen && (
        <UserSettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          initialTab={settingsModalInitialTab}
        />
      )}
    </>
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
