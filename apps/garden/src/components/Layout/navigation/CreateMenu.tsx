import { UserContext } from '@/providers/UserProvider'
import CommentOutlined from '@ant-design/icons/CommentOutlined'
import DownOutlined from '@ant-design/icons/DownOutlined'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
import YardIcon from '@mui/icons-material/Yard'
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
  getItem('Creations', '/create/creations', <YardIcon fontSize="inherit" />),
  getItem(
    'Models',
    '/create/concepts',
    <ModelTrainingIcon fontSize="small" />,
  ),
  getItem('Characters', '/create/characters', <RobotOutlined />),
]

const createMenuItems = (userFlags: string[]) => {
  const isPreviewUser = userFlags.includes('preview')
  const items = [...defaultItems]
  if (isPreviewUser) {
    items.push(...featurePreviewItems)
  }
  return items
}

const featurePreviewItems: MenuItem[] = [
  getItem('Scenarios', '/create/scenarios', <CommentOutlined />),
]

const CreateMenu = () => {
  const router = useRouter()
  const { user } = useContext(UserContext)

  const menuItems = createMenuItems(
    user && user.featureFlags ? user.featureFlags : [],
  )

  return (
    <div>
      <Menu
        mode={'horizontal'}
        selectedKeys={[router.pathname]}
        style={{ borderRight: 0 }}
        overflowedIndicator={<DownOutlined />}
        items={menuItems}
        className="text-black dark:text-white bg-gray-100 dark:bg-gray-900 rounded-lg mb-4"
      />
    </div>
  )
}

export default CreateMenu
