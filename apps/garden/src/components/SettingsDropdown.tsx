import ThemeToggleButton from '@/components/ThemeToggleButton'
import { UserContext } from '@/providers/UserProvider'
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { Dropdown, Space } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import React, { useContext } from 'react'

const LogoutButton = () => {
  const { logout } = useContext(UserContext)

  return (
    <Space onClick={() => logout()}>
      <LogoutOutlined />
      <div className="text-black dark:text-white">Disconnect Wallet</div>
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
    label: <LogoutButton />,
    key: '3',
  },
]

const SettingsDropdown = () => {
  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={['click']}
    >
      <SettingOutlined className="text-black dark:text-white" size={1000} />
    </Dropdown>
  )
}

export default SettingsDropdown
