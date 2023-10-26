import ThemeToggleButton from '@/components/Layout/dropdowns/ThemeToggleButton'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import LoginOutlined from '@ant-design/icons/LoginOutlined'
import LogoutOutlined from '@ant-design/icons/LogoutOutlined'
import SettingOutlined from '@ant-design/icons/SettingOutlined'
import TableOutlined from '@ant-design/icons/TableOutlined'
import ToolOutlined from '@ant-design/icons/ToolOutlined'
import { useViewportSize } from '@mantine/hooks'
import Button from '@mui/material/Button'
import { App, Dropdown, Slider, Switch } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

// import { UserButton } from '@clerk/nextjs'
// import Link from 'next/link'

// const Web3LoginLogoutButton = () => {
//   const { isConnected } = useWeb3State()
//   const { isAuthenticated, authenticate, logout } = useContext(UserContext)
//   const router = useRouter()

//   const handleAuthClick = useCallback(async () => {
//     if (!isAuthenticated) {
//       authenticate && (await authenticate())
//     } else {
//       logout && (await logout())
//       await router.push('/')
//     }
//   }, [logout, authenticate, isAuthenticated])

//   return (
//     <div>
//       <ConnectButton />
//       <Button
//         className="font-mono w-full flex items-center mt-2 "
//         onClick={handleAuthClick}
//       >
//         {isAuthenticated ? (
//           <div className="w-full">
//             <div className="flex justify-center">
//               <LogoutOutlined />
//               <div className="text-black dark:text-white ml-2">
//                 Disconnect Wallet
//               </div>
//             </div>
//           </div>
//         ) : !isConnected ? (
//           <div className="w-full">
//             <div className="flex justify-center">
//               <LoginOutlined />
//               <div className="text-black dark:text-white ml-2">
//                 Connect Wallet
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="w-full">
//             <div className="flex justify-center">
//               <LoginOutlined />
//               <div className="text-black dark:text-white ml-2">Sign In</div>
//             </div>
//           </div>
//         )}
//       </Button>
//     </div>
//   )
// }

const ClerkLoginLogoutButton = () => {
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

const ManageSubscriptionButton = () => {
  const { user } = useContext(UserContext)
  const router = useRouter()
  const { message } = App.useApp()

  const onManageSubscriptionClick = async () => {
    const customerId = user?.stripeCustomerId
    if (!customerId) {
      return
    }
    try {
      const response = await axios.post('/api/billing/subscription', {
        stripeCustomerId: customerId,
      })
      const { url } = response.data
      await router.push(url)
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  return (
    <div className="flex items-center">
      <ToolOutlined />
      <div
        className="ml-2 flex gap-2 w-full justify-between font-mono"
        onClick={onManageSubscriptionClick}
      >
        Manage Subscription
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

const clerkItems: ItemType[] = [
  {
    type: 'divider',
  },
  {
    label: <ClerkLoginLogoutButton />,
    key: 'clerk-login-logout',
  },
]

const clerkExtraItems: ItemType[] = [
  {
    type: 'divider',
  },
  // {
  //   label: <DevToolsLink />,
  //   key: '5',
  // },
  // {
  //   type: 'divider',
  // },
  // {
  //   label: <UserButton afterSignOutUrl="/" showName={true} />,
  //   key: '3',
  // },
]

const previewExtraItems: ItemType[] = [
  {
    label: <DevToolsLink />,
    key: 'dev-tools',
  },
]

const subscriberExtraItems: ItemType[] = [
  {
    type: 'divider',
  },
  {
    label: <ManageSubscriptionButton />,
    key: 'manage-subscription',
  },
]

export const SettingsDropdown = () => {
  const { isAuthenticated, featureFlags, user } = useContext(UserContext)
  console.log(user)
  const { width: windowWidth } = useViewportSize()
  const isPreviewUser = featureFlags?.includes('preview')

  const items: ItemType[] = [
    {
      label: <ThemeToggleButton />,
      key: 'theme-toggle',
    },
  ]

  if (windowWidth > 768) {
    const largeViewportItems: ItemType[] = [
      {
        type: 'divider',
      },
      {
        label: <MaxColumnSelector />,
        key: 'max-columns',
      },
    ]

    items.push(...largeViewportItems)
  }

  const [dropDownItems, setDropDownItems] = useState<ItemType[]>(items)

  useEffect(() => {
    let newDropDownItems = [...items]

    if (isAuthenticated) {
      newDropDownItems = [...newDropDownItems, ...clerkExtraItems]

      if (isPreviewUser) {
        newDropDownItems = [...newDropDownItems, ...previewExtraItems]
      }

      if (user?.subscriptionTier) {
        newDropDownItems = [...newDropDownItems, ...subscriberExtraItems]
      }
    }

    newDropDownItems = [...newDropDownItems, ...clerkItems]

    setDropDownItems(newDropDownItems)
  }, [isAuthenticated, user])

  return (
    <Dropdown
      menu={{
        items: dropDownItems,
      }}
      trigger={['click']}
      className="cursor-pointer"
      arrow={true}
    >
      <Button>
        <div className="flex items-center font-mono">
          <SettingOutlined className="text-xl" />
        </div>
      </Button>
    </Dropdown>
  )
}

export default SettingsDropdown
