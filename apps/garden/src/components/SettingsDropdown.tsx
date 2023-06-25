import ConnectButton from '@/components/ConnectButton'
import ThemeToggleButton from '@/components/ThemeToggleButton'
import { UserContext } from '@/providers/UserProvider'
import {
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Slider } from 'antd'
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
    <div>
      <ConnectButton />
      {!isConnected ? (
        <div>No wallet provider connected</div>
      ) : (
        <Button
          className="w-full flex items-center mt-2 "
          onClick={handleAuthClick}
        >
          {isAuthenticated ? (
            <div className="w-full">
              <div className="flex justify-center">
                <LogoutOutlined />
                <div className="text-black dark:text-white ml-2">
                  Disconnect Wallet
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex justify-center">
                <LoginOutlined />
                <div className="text-black dark:text-white ml-2">
                  Connect Wallet
                </div>
              </div>
            </div>
          )}
        </Button>
      )}
    </div>
  )
}

const MaxColumnSelector = () => {
  const { settings, updateSetting } = useContext(UserContext)
  const currentSetting = settings?.maxGridCols

  if (!currentSetting) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-center">
        <TableOutlined />
        <div className="ml-2">
          {currentSetting.params.displayName}:{' '}
          {currentSetting.value || currentSetting.params.defaultValue}
        </div>
      </div>
      <div onClick={ev => ev.stopPropagation()}>
        <Slider
          value={currentSetting.value || currentSetting.params.defaultValue}
          min={currentSetting.params.min}
          max={currentSetting.params.max}
          step={1}
          onChange={(newValue: number) =>
            updateSetting('maxGridCols', newValue)
          }
        />
      </div>
    </div>
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
    label: <MaxColumnSelector />,
    key: '1',
  },
  {
    type: 'divider',
  },
  {
    label: <LoginLogoutButton />,
    key: '3',
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
      <Button
        type="text"
        className="flex px-2 justify-center items-center text-xl"
      >
        <SettingOutlined className="text-black dark:text-white" />
      </Button>
    </Dropdown>
  )
}

export default SettingsDropdown
