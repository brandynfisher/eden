import HeaderLogo from '@/components/Layout/HeaderLogo'
import MannaDropdown from '@/components/Layout/dropdowns/MannaDropdown'
import QuickCreateMenu from '@/components/Layout/dropdowns/QuickCreateMenu'
import SettingsDropdown from '@/components/Layout/dropdowns/SettingsDropdown'
import CreationNotificationMenu from '@/components/Layout/dropdowns/TaskNotificationDropdown'
import Drawer from '@/components/Layout/navigation/Drawer'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import MyProfileButton from '@/components/Profile/MyProfileButton'
import { UserContext } from '@/providers/UserProvider'
import theme from '@/styles/theme'
import { useViewportSize } from '@mantine/hooks'
import { Layout } from 'antd'
import { Inter } from 'next/font/google'
import React, { useContext, useEffect, useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

const { Header } = Layout
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
      className={`flex gap-2 items-center px-4 bg-white dark:bg-gray-950 ${inter.className}`}
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
            <CreationNotificationMenu />
            <div className="hidden lg:flex">
              <MannaDropdown />
            </div>
          </>
        )}

        <SettingsDropdown />
        <MyProfileButton />
      </div>
    </Header>
  )
}

export default LayoutHeader
