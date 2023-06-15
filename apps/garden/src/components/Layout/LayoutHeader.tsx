import CreationNotificationMenu from '@/components/TaskNotificationDropdown'
import { UserContext } from '@/providers/UserProvider'
import { WalletOutlined } from '@ant-design/icons'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Layout, Space } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  const { isConnected, isAuthenticated, authenticate, mannaBalance } =
    useContext(UserContext)

  const handleAuthClick = () => {
    if (!isAuthenticated) {
      authenticate && authenticate()
    }
  }

  return (
    <div>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo">
          <Link href="/">
            <img
              src="/favicon-32x32.png"
              alt="Logo"
              style={{ height: '32px', marginRight: '16px' }}
            />
          </Link>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Space>
            <CreationNotificationMenu />
            {isConnected && (
              <div
                onClick={handleAuthClick}
                className={`text-${
                  isAuthenticated ? 'green' : 'blue'
                }-500 text-2xl`}
              >
                <Space>
                  {isAuthenticated ? mannaBalance : 'Sign in'}
                  <WalletOutlined />
                </Space>
              </div>
            )}
            <ConnectButton />
          </Space>
        </div>
      </Header>
    </div>
  )
}

export default LayoutHeader
