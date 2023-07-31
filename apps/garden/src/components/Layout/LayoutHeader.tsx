import HeaderLogo from '@/components/Layout/HeaderLogo'
import MannaDropdown from '@/components/Layout/dropdowns/MannaDropdown'
import QuickCreateMenu from '@/components/Layout/dropdowns/QuickCreateMenu'
import SettingsDropdown from '@/components/Layout/dropdowns/SettingsDropdown'
import CreationNotificationMenu from '@/components/Layout/dropdowns/TaskNotificationDropdown'
import Drawer from '@/components/Layout/navigation/Drawer'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import MyProfileButton from '@/components/Profile/MyProfileButton'
import { UserContext } from '@/providers/UserProvider'
import { Layout } from 'antd'
import React, { useContext } from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  const { isAuthenticated } = useContext(UserContext)
  return (
    <Header
      className="flex items-center px-4 bg-white dark:bg-gray-950"
      style={{ gap: '8px' }}
    >
      <HeaderLogo />

      <div className="flex lg:hidden">
        <Drawer />
      </div>

      <div className="hidden sm:flex w-full">
        <MainNavButtons />

        <div className="ml-auto">
          <div className="flex items-center" style={{ gap: '8px' }}>
            {isAuthenticated && <QuickCreateMenu />}
          </div>
        </div>
      </div>

      <div className="ml-auto sm:ml-0 flex items-center" style={{ gap: '8px' }}>
        <div className="hidden xs:flex">
          <CreationNotificationMenu />
        </div>
        <MannaDropdown />
        <SettingsDropdown />
        <MyProfileButton />
      </div>
    </Header>
  )
}

export default LayoutHeader
