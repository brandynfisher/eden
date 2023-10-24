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
import React, { useContext, useEffect, useState } from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  const { isAuthenticated } = useContext(UserContext)

  const { width: viewportWidth } = useViewportSize()
  const [isSmallScreen, setIsSmallScreen] = useState(
    viewportWidth < theme.screens.lg,
  )

  useEffect(() => {
    if (viewportWidth < theme.screens.lg) {
      setIsSmallScreen(true)
    } else {
      setIsSmallScreen(false)
    }
  }, [viewportWidth])

  return (
    <Header className={`px-4 bg-white dark:bg-gray-950 leading-none`}>
      <div className="flex gap-2 items-center leading-[64px]">
        <HeaderLogo />

        {isSmallScreen && (
          <div className="flex">
            <Drawer />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <QuickCreateMenu />

          {!isSmallScreen && isAuthenticated ? (
            <>
              <TaskNotificationDropdown />
              <MannaDropdown />
            </>
          ) : null}

          <SettingsDropdown />
          <ClerkMyProfileButton />
        </div>
      </div>

      <div className="w-full flex">
        {isSmallScreen && isAuthenticated ? (
          <div className="flex ml-auto">
            <TaskNotificationDropdown />
            <MannaDropdown />
          </div>
        ) : null}
      </div>
    </Header>
  )
}

export default LayoutHeader
