import ThemeToggleButton from '@/components/Layout/dropdowns/ThemeToggleButton'
import { UserContext } from '@/providers/UserProvider'
import {
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  TableOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { UserButton } from '@clerk/nextjs'
import { Button, Dropdown, Slider, Switch } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import Link from 'next/link'
import React, { useContext, useEffect, useState } from 'react'

const LoginLogoutButton = () => {
  const { isAuthenticated, authenticate, logout } = useContext(UserContext)

  return (
    <div>
      <div className="w-full">
        {isAuthenticated ? (
          <Button
            className="flex gap-2 justify-center font-mono w-full items-center"
            onClick={async () => logout && (await logout())}
          >
            <LogoutOutlined />
            <div>Sign out</div>
          </Button>
        ) : (
          <Button
            className="flex gap-2 justify-center font-mono w-full items-center"
            onClick={async () => authenticate && (await authenticate())}
          >
            <LoginOutlined />
            <div>Sign in</div>
          </Button>
        )}
      </div>
    </div>
  )
}

const MaxColumnSelector = () => {
  const { settings, updateSetting } = useContext(UserContext)
  const currentSetting = settings?.maxGridCols

  const updateMaxGridCols = (newValue: number | 'auto') => {
    updateSetting('maxGridCols', newValue)
  }

  if (!currentSetting) {
    return null
  }

  return (
    <div className="w-full">
      <div className="flex items-center">
        <TableOutlined />
        <div className="ml-2 flex gap-2 w-full justify-between font-mono">
          {currentSetting.params.displayName}
          <div className="flex gap-2 items-center">
            <div className="text-gray-500">
              {currentSetting.value !== 'auto' ? currentSetting.value : 'auto'}
            </div>
            <Switch
              title="Toggle column count (automatic/fixed number)"
              checked={currentSetting.value === 'auto'}
              onClick={(newValue, ev) => {
                updateMaxGridCols(
                  currentSetting.value === 'auto'
                    ? currentSetting.params.initialValue
                    : 'auto',
                )
                ev.stopPropagation()
              }}
            />
          </div>
        </div>
      </div>
      <div
        className="flex justify-between items-center"
        onClick={ev => ev.stopPropagation()}
      >
        {currentSetting.value !== 'auto' && (
          <Slider
            className="w-full"
            value={currentSetting.value}
            min={currentSetting.params.min}
            max={currentSetting.params.max}
            step={1}
            onChange={(newValue: number) => updateMaxGridCols(newValue)}
          />
        )}
      </div>
    </div>
  )
}

const DevToolsLink = () => {
  return (
    <Link className="w-full" href="/tools">
      <div className="flex items-center">
        <ToolOutlined />
        <div className="ml-2 flex gap-2 w-full justify-between font-mono">
          Dev Tools
        </div>
      </div>
    </Link>
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
]

const extraItems: ItemType[] = [
  {
    type: 'divider',
  },
  {
    label: <DevToolsLink />,
    key: '2',
  },
  {
    type: 'divider',
  },
  {
    label: <UserButton afterSignOutUrl="/" showName={true} />,
    key: '3',
  },
  {
    label: <LoginLogoutButton />,
    key: '4',
  },
]

const SettingsDropdown = () => {
  const { isAuthenticated } = useContext(UserContext)
  const [dropDownItems, setDropDownItems] = useState<ItemType[]>(items)

  useEffect(() => {
    if (isAuthenticated) {
      setDropDownItems([...items, ...extraItems])
    } else {
      setDropDownItems(items)
    }
  }, [isAuthenticated])

  return (
    <Dropdown
      menu={{
        items: dropDownItems,
      }}
      trigger={['click']}
      className="cursor-pointer"
      arrow={true}
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
