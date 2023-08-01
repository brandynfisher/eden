import { UserContext } from '@/providers/UserProvider'
import {
  CommentOutlined,
  ExperimentOutlined,
  RobotOutlined,
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

const authItems: MenuItem[] = [
  // getItem('Logout', '/logout', <ToolOutlined />),
]

const defaultItems: MenuItem[] = [
  getItem('Create', '/create', <ExperimentOutlined />),
  getItem('Tools', '/tools', <ToolOutlined />),
  getItem('Characters', '/characters', <RobotOutlined />),
  getItem('Scenarios', '/scenarios', <CommentOutlined />),
]

const createMenuItems = (
  isAuthenticated: boolean,
  username: string | undefined,
) => {
  const userProfilePath =
    isAuthenticated && username ? `/creators/${username.toLowerCase()}` : ''
  const myProfileItem = getItem('My Profile', userProfilePath, <UserOutlined />)
  return isAuthenticated
    ? [myProfileItem, ...authItems, ...defaultItems]
    : [myProfileItem, ...defaultItems]
}

const LayoutMenu = () => {
  const router = useRouter()
  const { isAuthenticated, user } = useContext(UserContext)

  const menuItems = createMenuItems(isAuthenticated, user?.username)

  return (
    <Menu
      mode="inline"
      selectedKeys={[router.pathname]}
      style={{ height: '100%', borderRight: 0 }}
      items={menuItems}
      className="text-black dark:text-white bg-gray-100 dark:bg-gray-900"
    />
  )
}

export default LayoutMenu
