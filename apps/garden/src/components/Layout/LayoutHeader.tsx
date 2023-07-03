import Drawer from '@/components/Layout/Drawer'
import HeaderLogo from '@/components/Layout/HeaderLogo'
import MainNavButtons from '@/components/Layout/MainNavButtons'
import MannaDropdown from '@/components/MannaDropdown'
import MyProfileButton from '@/components/MyProfileButton'
import QuickCreateMenu from '@/components/QuickCreateMenu'
import SettingsDropdown from '@/components/SettingsDropdown'
import CreationNotificationMenu from '@/components/TaskNotificationDropdown'
import { Layout } from 'antd'
import React from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  return (
    <Header
      className="flex items-center px-4 bg-white dark:bg-gray-950"
      style={{ gap: '8px' }}
    >
      <HeaderLogo />

      <div className="flex sm:hidden">
        <Drawer />
      </div>

      <div className="hidden sm:flex w-full">
        <MainNavButtons />

        <div className="ml-auto">
          <div className="flex items-center" style={{ gap: '8px' }}>
            <CreationNotificationMenu />
            <QuickCreateMenu />
          </div>
        </div>
      </div>

      <div className="ml-auto sm:ml-0 flex items-center" style={{ gap: '8px' }}>
        <MannaDropdown />
        <SettingsDropdown />
        <MyProfileButton />
      </div>
    </Header>
  )
}

export default LayoutHeader
