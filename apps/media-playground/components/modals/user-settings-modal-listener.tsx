'use client'

import { UserSettingsModal } from '@/features/account/user-settings-modal'
import {
  USER_SETTINGS_EVENT,
  markUserSettingsListenerReady,
} from '@/lib/user-settings'
import { useEffect, useState } from 'react'

const DEFAULT_TAB = 'subscription'

export const UserSettingsModalListener = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<string>(DEFAULT_TAB)

  useEffect(() => {
    markUserSettingsListenerReady()
    const handleOpenSettings = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: string }>).detail
      setInitialTab(detail?.tab || DEFAULT_TAB)
      setIsOpen(true)
    }

    window.addEventListener(USER_SETTINGS_EVENT, handleOpenSettings)
    return () =>
      window.removeEventListener(USER_SETTINGS_EVENT, handleOpenSettings)
  }, [])

  return (
    <UserSettingsModal
      open={isOpen}
      onOpenChange={setIsOpen}
      initialTab={initialTab}
    />
  )
}

export default UserSettingsModalListener
