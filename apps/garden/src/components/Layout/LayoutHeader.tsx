import NavButton from '@/components/Layout/NavButton'
import MannaDropdown from '@/components/MannaDropdown'
import MyProfileButton from '@/components/MyProfileButton'
import QuickCreateMenu from '@/components/QuickCreateMenu'
import SettingsDropdown from '@/components/SettingsDropdown'
import CreationNotificationMenu from '@/components/TaskNotificationDropdown'
import { AppstoreOutlined, HomeOutlined } from '@ant-design/icons'
import { Layout } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const { Header } = Layout

type NavButtonItem = { text: string; path: string; icon: React.ReactNode }

const NavButtons = ({ items }: { items: NavButtonItem[] }) => {
  const router = useRouter()

  return (
    <>
      {items.map(item => (
        <NavButton
          key={item.path}
          isActive={router.pathname === item.path}
          text={item.text}
          path={item.path}
          icon={item.icon}
        />
      ))}
    </>
  )
}

const navItems = [
  { text: 'Creations', icon: <HomeOutlined />, path: '/' },
  { text: 'Collections', icon: <AppstoreOutlined />, path: '/collections' },
  // {text: 'Concepts', icon: <HomeOutlined/>, path: '/concepts'},
]

const LayoutHeader = () => {
  return (
    <Header className="flex items-center px-4 bg-white dark:bg-gray-950">
      <div className="demo-logo">
        <Link href="/">
          <img
            src="/favicon-32x32.png"
            alt="Logo"
            style={{ height: '32px', marginRight: '16px', top: '-1px' }}
            className="relative"
          />
        </Link>
      </div>

      <NavButtons items={navItems} />

      <div className="ml-auto">
        <div className="flex items-center" style={{ gap: '8px' }}>
          <CreationNotificationMenu />
          <QuickCreateMenu />
          <MannaDropdown />
          <SettingsDropdown />
          <MyProfileButton />
        </div>
      </div>
    </Header>
  )
}

export default LayoutHeader
