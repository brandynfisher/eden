import { UserContext } from '@/providers/UserProvider'
import {
  EyeOutlined,
  HomeOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Menu, type MenuProps } from 'antd'
import { Layout } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const { Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label: <Link href={key.toString()}>{label}</Link>,
  } as MenuItem
}

const items: MenuItem[] = [getItem('All Creations', '/', <HomeOutlined />)]

const authItems: MenuItem[] = [
  getItem('My Profile', '/me', <UserOutlined />),
  getItem('Create', '/create', <EyeOutlined />),
  getItem('Tools', '/tools', <ToolOutlined />),
]

const LayoutMenu = () => {
  const router = useRouter()
  const { isConnected } = useContext(UserContext)
  const menuItems = isConnected ? authItems : items

  return (
    <Sider width={200} className="mr-4 rounded-lg overflow-hidden">
      <Menu
        mode="inline"
        selectedKeys={[router.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        className="text-black bg-white dark:text-white dark:bg-gray-900"
      />
    </Sider>
  )
}

export default LayoutMenu
