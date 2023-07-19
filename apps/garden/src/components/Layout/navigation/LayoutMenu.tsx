import { UserContext } from '@/providers/UserProvider'
import {
  ExperimentOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Menu, type MenuProps } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

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

const defaultItems: MenuItem[] = [
  getItem('My Profile', '/me', <UserOutlined />),
  getItem('Create', '/create', <ExperimentOutlined />),
  getItem('Tools', '/tools', <ToolOutlined />),
]

const authItems: MenuItem[] = [
  // getItem('Logout', '/logout', <ToolOutlined />),
]

const LayoutMenu = () => {
  const router = useRouter()
  const { isAuthenticated } = useContext(UserContext)
  const menuItems = isAuthenticated
    ? [...defaultItems, ...authItems]
    : defaultItems

  return (
    <Menu
      mode="inline"
      selectedKeys={[router.pathname]}
      style={{ height: '100%', borderRight: 0 }}
      items={menuItems}
      className="text-black bg-white dark:text-white dark:bg-gray-900"
    />
  )
}

export default LayoutMenu
