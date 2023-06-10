import { UserContext } from '@/providers/UserProvider'
import {
  BellOutlined,
  HomeOutlined,
  RobotOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Menu, type MenuProps, theme } from 'antd'
import { Layout } from 'antd'
import Link from 'next/link'
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
  getItem('All Creations', '/', <HomeOutlined />),
  getItem('My Profile', '/me', <UserOutlined />),
  getItem('Create', '/create', <ToolOutlined />),
  getItem('Agents', '/agents', <RobotOutlined />),
  getItem('Scenarios', '/scenarios', <BellOutlined />),
]

const LayoutMenu = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const { isConnected } = useContext(UserContext)
  const menuItems = isConnected ? authItems : items

  return (
    <Sider width={200} style={{ background: colorBgContainer }}>
      <Menu
        mode="inline"
        defaultSelectedKeys={['sub1']}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
      />
    </Sider>
  )
}

export default LayoutMenu
