import HeaderLogo from '@/components/Layout/HeaderLogo'
import QuickCreateMenu from '@/components/Layout/dropdowns/QuickCreateMenu'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import {
  ClerkMyProfileButton,
  Web3MyProfileButton,
} from '@/components/Profile/MyProfileButton'
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

const TaskNotificationDropdown = dynamic(
  () => import('@/components/Layout/dropdowns/TaskNotificationDropdown'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const MannaDropdown = dynamic(
  () => import('@/components/Layout/dropdowns/MannaDropdown'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const SettingsDropdown = dynamic(
  () => import('@/components/Layout/dropdowns/SettingsDropdown'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const LayoutHeader = () => {
  const { width: viewportWidth } = useViewportSize()
  const { isAuthenticated } = useContext(UserContext)
  const [mountDrawer, setMountDrawer] = useState(true)

  useEffect(() => {
    if (viewportWidth >= theme.screens.lg) {
      setMountDrawer(false)
    } else {
      setMountDrawer(true)
    }
  }, [viewportWidth])

  return (
    <Header
      className={`flex gap-2 items-center px-4 bg-white dark:bg-gray-950`}
    >
      <HeaderLogo />

      {mountDrawer && (
        <div className="flex">
          <Drawer />
        </div>
      )}

      <div className="hidden md:flex w-full">
        <MainNavButtons />
      </div>

      <div className="ml-auto md:ml-0 flex items-center gap-2">
        <QuickCreateMenu />

        {isAuthenticated && (
          <>
            <TaskNotificationDropdown />
            <div className="hidden lg:flex">
              <MannaDropdown />
            </div>
          </>
        )}

        <SettingsDropdown />
        {process.env.NEXT_PUBLIC_FLAG_CLERK_ENABLED === 'true' ? (
          <ClerkMyProfileButton />
        ) : (
          <Web3MyProfileButton />
        )}
      </div>
    </Header>
  )
}

export default LayoutHeader
