import { ToolOutlined, UserOutlined } from '@ant-design/icons'
import { Menu, type MenuProps, theme } from 'antd'
import { Layout } from 'antd'
import React from 'react'

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
    label,
  } as MenuItem
}

const items: MenuItem[] = [
  getItem('User', 'sub1', <UserOutlined />, [
    getItem('My account', '1'),
    getItem('My creations', '2'),
  ]),
  getItem('Apps', 'sub2', <ToolOutlined />, [getItem('Voice2Image', '3')]),
  getItem('Generators', 'sub3', <ToolOutlined />, [
    getItem('Create', '5'),
    getItem('Interpolate', '6'),
    getItem('Real2Real', '7'),
    getItem('Remix', '8'),
    getItem('Interrogate', '9'),
    getItem('Lora train', '10'),
    getItem('TTS', '11'),
    getItem('Wav2Lip', '12'),
    getItem('Complete', '13'),
  ]),
]

const LayoutMenu = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <Sider width={200} style={{ background: colorBgContainer }}>
      <Menu
        mode="inline"
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        style={{ height: '100%', borderRight: 0 }}
        items={items}
      />
    </Sider>
  )
}

export default LayoutMenu
