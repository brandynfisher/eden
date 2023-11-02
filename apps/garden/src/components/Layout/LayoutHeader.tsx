import HeaderLogo from '@/components/Layout/HeaderLogo'
import MannaDropdown from '@/components/Layout/dropdowns/MannaDropdown'
import QuickCreateMenu from '@/components/Layout/dropdowns/QuickCreateMenu'
import SettingsDropdown from '@/components/Layout/dropdowns/SettingsDropdown'
import TaskNotificationDropdown from '@/components/Layout/dropdowns/TaskNotificationDropdownMUI'
import Drawer from '@/components/Layout/navigation/Drawer'
import { ClerkMyProfileButton } from '@/components/Profile/MyProfileButton'
import { UserContext } from '@/providers/UserProvider'
import theme from '@/styles/theme'
import { useViewportSize } from '@mantine/hooks'
import { Layout } from 'antd'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  const { isAuthenticated } = useContext(UserContext)
  const router = useRouter()
  const { width: viewportWidth } = useViewportSize()
  const [showQuickCreateButton, setShowQuickCreateButton] = useState(true)

  useEffect(() => {
    setShowQuickCreateButton(!router.pathname.includes('/create/'))
  }, [router.pathname])

  return (
    <Header className={`px-4 bg-white dark:bg-gray-950 leading-none`}>
      <div className="flex gap-2 items-center leading-[64px]">
        <HeaderLogo />

        {viewportWidth < theme.screens.lg && (
          <div className="flex">
            <Drawer />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {showQuickCreateButton ? <QuickCreateMenu /> : null}

          {isAuthenticated && viewportWidth >= theme.screens.sm ? (
            <>
              <TaskNotificationDropdown />
              <MannaDropdown />
            </>
          ) : null}

          <SettingsDropdown />
          <ClerkMyProfileButton />
        </div>
      </div>

      {viewportWidth < theme.screens.sm && isAuthenticated ? (
        <div className="w-full flex justify-between">
          <TaskNotificationDropdown />
          <div className="ml-auto">
            <MannaDropdown />
          </div>
        </div>
      ) : null}
    </Header>
  )
}

export default LayoutHeader
