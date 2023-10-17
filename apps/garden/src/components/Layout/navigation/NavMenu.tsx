import HeaderLogo from '@/components/Layout/HeaderLogo'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import SocialLinks from '@/components/Layout/navigation/SocialLinks'
import {
  CommentOutlined,
  ExperimentOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import {
  AccountCircleOutlined,
  ExploreOutlined,
  HomeOutlined,
  ModelTraining,
  Yard,
} from '@mui/icons-material'
import { Layout, Menu } from 'antd'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const menuItems = [
  {
    key: 'home',
    icon: <HomeOutlined fontSize="medium" />,
    label: 'Home',
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    key: 'explore',
    icon: <ExploreOutlined fontSize="medium" />,
    label: 'Explore',
    children: [
      {
        key: 'explore/creations',
        icon: <Yard fontSize="medium" />,
        label: 'Creations',
      },
      {
        key: 'explore/concepts',
        icon: <ModelTraining fontSize="medium" />,
        label: 'Concepts',
      },
    ],
  },
  {
    key: 'create',
    icon: <ExperimentOutlined />,
    label: 'Create',
    children: [
      {
        key: 'create/creations',
        icon: <Yard fontSize="medium" />,
        label: 'Creations',
      },
      {
        key: 'create/concepts',
        icon: <ModelTraining fontSize="medium" />,
        label: 'Concepts',
      },
      {
        key: 'create/characters',
        icon: <RobotOutlined />,
        label: 'Characters',
        disabled: true,
      },
      {
        key: 'create/scenarios',
        icon: <CommentOutlined />,
        label: 'Scenarios',
        disabled: true,
      },
    ],
  },
  {
    type: 'divider',
    key: 'd2',
  },
  {
    key: 'profile',
    icon: <AccountCircleOutlined fontSize="medium" />,
    label: 'My Profile',
  },
  // {
  //   key: 'manna',
  //   icon: <AccountBalanceWalletOutlined fontSize="medium"/>,
  //   label: 'Manna',
  //   children: [
  //     {
  //       key: 'manna-page',
  //       icon: <AddCircleOutlined fontSize="medium"/>,
  //       label: 'Get more'
  //     }
  //   ]
  // },
  // {
  //   type: 'divider',
  //   key: 'd1'
  // },
  // {
  //   key: 'manna',
  //   render: <div>123 manna</div>,
  // },
]

const NavMenuHeader = ({
  onClose,
  isVisible,
}: {
  onClose: () => void
  isVisible: boolean
}) => {
  return (
    <div className="flex justify-between items-center py-4 pl-4 pr-1 h-[64px]">
      <HeaderLogo />
      <div
        className={`block lg:hidden transition-opacity delay-75 duration-75 ${
          !isVisible ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      >
        <NavBurgerButton open={isVisible} />
      </div>
    </div>
  )
}

const NavMenu = ({
  onClose,
  isVisible,
}: {
  onClose?: () => void
  isVisible: boolean
}) => {
  const router = useRouter()
  const [menuTheme, setMenuTheme] = useState<'dark' | undefined>('dark')
  const { resolvedTheme } = useTheme()

  const onCloseHandler = () => {
    onClose && onClose()
  }

  useEffect(() => {
    router.events.on('routeChangeComplete', onCloseHandler)

    return () => {
      router.events.off('routeChangeComplete', onCloseHandler)
    }
  }, [])

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setMenuTheme('dark')
    } else {
      setMenuTheme(undefined)
    }
  }, [resolvedTheme])

  return (
    <Layout.Sider
      className={`!fixed overflow-auto h-full left-0 top-0 bottom-0 !bg-white dark:!bg-gray-900`}
    >
      <div className="flex flex-col h-full">
        <NavMenuHeader onClose={onCloseHandler} isVisible={isVisible} />
        <Menu
          className="!bg-white dark:!bg-gray-900"
          theme={menuTheme}
          mode="inline"
          defaultSelectedKeys={['home']}
          items={menuItems}
        />
        <div
          className="flex flex-col h-full"
          style={{ borderInlineEnd: '1px solid rgba(5, 5, 5, 0.06)' }}
        >
          <div className="mt-auto">
            <SocialLinks />
            <div className="text-center text-gray-500">EdenLabs ©2023</div>
            <div className="flex gap-2 flex-wrap text-xs justify-center my-2">
              <a href="#">Terms of Use</a>
              <span className="text-gray-500">|</span>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </Layout.Sider>
  )
}

export default NavMenu
