import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import GithubOutlined from '@ant-design/icons/GithubOutlined'
import InstagramOutlined from '@ant-design/icons/InstagramOutlined'
import TwitterOutlined from '@ant-design/icons/TwitterOutlined'
import { Menu, type MenuProps } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

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
    className: '!my-1',
    label: <Link href={key.toString()}>{label}</Link>,
  } as MenuItem
}

const defaultItems: MenuItem[] = [
  getItem('Create', '/create/creations', <ExperimentOutlined />),
]

const LayoutMenu = ({ inDrawer }: { inDrawer?: boolean }) => {
  const router = useRouter()
  const menuItems = defaultItems

  return (
    <div>
      <Menu
        mode="inline"
        selectedKeys={[router.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        className="text-black dark:text-white bg-gray-100 dark:bg-gray-900 rounded-lg"
      />

      <div
        className={`flex gap-2 px-4 py-3 items-center justify-between ${
          inDrawer ? '' : 'rounded-lg  mt-2'
        }`}
      >
        <a
          href="https://github.com/edenartlab"
          target="_blank"
          rel="noopener noreferrer"
          title="Eden on Github"
          className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
        >
          <GithubOutlined className="text-2xl" />
        </a>
        <a
          href="https://discord.com/invite/4dSYwDT"
          target="_blank"
          rel="noopener noreferrer"
          title="Eden on Discord"
          className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
        >
          <SvgDiscord className="text-2xl" />
        </a>
        <a
          href="https://twitter.com/eden_art_"
          target="_blank"
          rel="noopener noreferrer"
          title="Eden on Twitter"
          className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
        >
          <TwitterOutlined className="text-2xl" />
        </a>
        <a
          href="https://instagram.com/eden.art____"
          target="_blank"
          rel="noopener noreferrer"
          title="Eden on Instagram"
          className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
        >
          <InstagramOutlined className="text-2xl" />
        </a>
      </div>
    </div>
  )
}

export default LayoutMenu
