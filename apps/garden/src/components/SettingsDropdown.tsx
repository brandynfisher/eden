import ThemeToggleButton from '@/components/ThemeToggleButton'
import { UserContext } from '@/providers/UserProvider'
import {
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Space } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import React, { useCallback, useContext } from 'react'

const LoginLogoutButton = () => {
  const { isConnected, isAuthenticated, authenticate, logout } =
    useContext(UserContext)

  const handleAuthClick = useCallback(() => {
    if (!isAuthenticated) {
      authenticate && authenticate()
    } else {
      logout && logout()
    }
  }, [logout, authenticate, isAuthenticated])

  return (
    <Space onClick={handleAuthClick}>
      {!isConnected ? (
        <div>No wallet provider connected</div>
      ) : (
        <>
          {isAuthenticated ? (
            <>
              <LogoutOutlined />
              <div className="text-black dark:text-white">
                Disconnect Wallet
              </div>
            </>
          ) : (
            <>
              <LoginOutlined />
              <div className="text-black dark:text-white">Connect Wallet</div>
            </>
          )}
        </>
      )}
    </Space>
  )
}

const items: ItemType[] = [
  {
    label: <ThemeToggleButton />,
    key: '0',
  },
  {
    type: 'divider',
  },
  {
    label: <LoginLogoutButton />,
    key: '2',
  },
]

const SettingsDropdown = () => {
  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={['hover', 'click']}
      className="cursor-pointer"
    >
      <Button type="text" className="flex">
        <SettingOutlined className="text-black dark:text-white text-xl mr-2" />
      </Button>
    </Dropdown>
  )
}

export default SettingsDropdown
