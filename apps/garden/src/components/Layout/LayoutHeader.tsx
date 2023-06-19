import MannaDropdown from '@/components/MannaDropdown'
import SettingsDropdown from '@/components/SettingsDropdown'
import CreationNotificationMenu from '@/components/TaskNotificationDropdown'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Layout } from 'antd'
import Link from 'next/link'
import React from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  return (
    <Header className="flex items-center px-4 bg-white dark:bg-gray-800">
      <div className="demo-logo">
        <Link href="/">
          <img
            src="/favicon-32x32.png"
            alt="Logo"
            style={{ height: '32px', marginRight: '16px' }}
          />
        </Link>
      </div>
      <div className="ml-auto">
        <div className="flex items-center" style={{ gap: '8px' }}>
          <CreationNotificationMenu />
          <MannaDropdown />
          <SettingsDropdown />
          <ConnectButton />
        </div>
      </div>
    </Header>
  )
}

export default LayoutHeader
