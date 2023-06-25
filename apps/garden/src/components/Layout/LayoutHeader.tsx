import ConnectButton from '@/components/ConnectButton'
import NavButton from '@/components/Layout/NavButton'
import MannaDropdown from '@/components/MannaDropdown'
import SettingsDropdown from '@/components/SettingsDropdown'
import CreationNotificationMenu from '@/components/TaskNotificationDropdown'
import { Layout } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const { Header } = Layout

type NavButtonItem = { text: string; path: string }

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
        />
      ))}
    </>
  )
}

const navItems = [
  { text: 'Creations', path: '/' },
  { text: 'Collections', path: '/collections' },
  { text: 'Concepts', path: '/concepts' },
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
        <div className="flex items-center" style={{ gap: '4px' }}>
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
