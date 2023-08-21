import { UserContext } from '@/providers/UserProvider'
import { CommentOutlined, RobotOutlined } from '@ant-design/icons'
import { DownOutlined } from '@ant-design/icons'
import FilterVintageIcon from '@mui/icons-material/FilterVintage'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
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
    className: '!my-1',
    label: <Link href={key.toString()}>{label}</Link>,
  } as MenuItem
}

const defaultItems: MenuItem[] = [
  getItem(
    'Creations',
    '/create/creations',
    <FilterVintageIcon fontSize="inherit" />,
  ),
]

const featurePreviewItems: MenuItem[] = [
  getItem(
    'Concepts',
    '/create/concepts',
    <ModelTrainingIcon fontSize="small" />,
  ),
  getItem('Characters', '/create/characters', <RobotOutlined />),
  getItem('Scenarios', '/create/scenarios', <CommentOutlined />),
]

const createMenuItems = (
  isAuthenticated: boolean,
  username: string | undefined,
  userFlags: string[],
) => {
  const isPreviewUser = userFlags.includes('preview')
  const items = [...defaultItems]
  if (isPreviewUser) {
    items.push(...featurePreviewItems)
  }
  return items
}

const CreateMenu = () => {
  const router = useRouter()
  const { isAuthenticated, user, featureFlags } = useContext(UserContext)

  const menuItems = createMenuItems(
    isAuthenticated,
    user?.username,
    featureFlags,
  )

  return (
    <div>
      <Menu
        mode={'horizontal'}
        selectedKeys={[router.pathname]}
        style={{ borderRight: 0 }}
        overflowedIndicator={<DownOutlined />}
        items={menuItems}
        className="text-black dark:text-white bg-gray-100 dark:bg-gray-900 rounded-lg"
      />
    </div>
  )
}

export default CreateMenu
