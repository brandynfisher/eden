import HeaderLogo from '@/components/Layout/HeaderLogo'
import MannaDropdown from '@/components/Layout/dropdowns/MannaDropdown'
import QuickCreateMenu from '@/components/Layout/dropdowns/QuickCreateMenu'
import SettingsDropdown from '@/components/Layout/dropdowns/SettingsDropdown'
import TaskNotificationDropdown from '@/components/Layout/dropdowns/TaskNotificationDropdownMUI'
import LoadingIndicator from '@/components/LoadingIndicator'
import { ClerkMyProfileButton } from '@/components/Profile/MyProfileButton'
import { UserContext } from '@/providers/UserProvider'
import theme from '@/styles/theme'
import { useViewportSize } from '@mantine/hooks'
import { Layout } from 'antd'
import dynamic from 'next/dynamic'
import React, { useContext, useEffect, useState } from 'react'

const { Header } = Layout

const Drawer = dynamic(() => import('@/components/Layout/navigation/Drawer'), {
  loading: () => <LoadingIndicator />,
})

const LayoutHeader = () => {
  const { width: viewportWidth } = useViewportSize()
  const { isAuthenticated } = useContext(UserContext)
  const [mountDrawer, setMountDrawer] = useState(true)
  const [isSmallScreen, setIsSmallScreen] = useState(
    viewportWidth < theme.screens.md,
  )

  useEffect(() => {
    if (viewportWidth >= theme.screens.lg) {
      setMountDrawer(false)
    } else {
      setMountDrawer(true)
    }
  }, [viewportWidth])

  useEffect(() => {
    if (viewportWidth < theme.screens.md) {
      setIsSmallScreen(true)
    } else {
      setIsSmallScreen(false)
    }
  }, [viewportWidth])

  return (
    <Header className={`px-4 bg-white dark:bg-gray-950 leading-none`}>
      <div className="flex gap-2 items-center leading-[64px]">
        <HeaderLogo />

        {mountDrawer && (
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
