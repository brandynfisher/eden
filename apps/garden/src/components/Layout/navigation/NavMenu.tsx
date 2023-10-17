import HeaderLogo from '@/components/Layout/HeaderLogo'
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
import React from 'react'

const { Sider } = Layout

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
  {
    key: 'manna',
    render: <div>123 manna</div>,
  },
]

const NavMenu = () => {
  return (
    <Sider className="!fixed overflow-auto h-screen left-0 top-0 bottom-0">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <HeaderLogo />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['home']}
          items={menuItems}
        />
        <div className="mt-auto py-4">
          <SocialLinks />
          <div className="text-center text-gray-500">EdenLabs ©2023</div>
          <div className="flex gap-2 flex-wrap text-xs justify-center mt-2">
            <a href="#">Terms of Use</a>
            <span className="text-gray-500">|</span>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </Sider>
  )
}

export default NavMenu
