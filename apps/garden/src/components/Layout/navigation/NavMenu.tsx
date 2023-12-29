import SocialLinks from '@/components/Layout/navigation/SocialLinks'
import { UserContext } from '@/providers/UserProvider'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import { PeopleOutline } from '@mui/icons-material'
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import ExploreOutlined from '@mui/icons-material/ExploreOutlined'
import ModelTraining from '@mui/icons-material/ModelTraining'
import Yard from '@mui/icons-material/Yard'
import { Layout, Menu } from 'antd'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import NavMenuHeader from './NavMenuHeader'
import NavMenuProfileLink from './NavMenuProfileLink'

type ItemType = {
  key: string
  icon?: ReactNode
  label?: string
  type?: 'divider'
  children?: ItemType[]
  disabled?: boolean
  path?: string
  onClick?: (item: ItemType) => void
  onTitleClick?: (ev: { key: string }) => void
}

function extractKeys(
  menuItems: ItemType[],
  parentItemKey?: string,
): string[][] {
  let keys: string[][] = []

  for (const item of menuItems) {
    if (item.type === 'divider') continue

    if (parentItemKey) {
      keys.push([item.key, parentItemKey])
    } else {
      keys.push([item.key])
    }

    if (item.children) {
      keys = keys.concat(extractKeys(item.children, item.key))
    }
  }

  return keys
    .filter(key => key[0][0] === '/')
    .sort((a, b) => b[0].length - a[0].length)
}

const NavMenu = ({
  onClose,
  isVisible,
}: {
  onClose?: () => void
  isVisible: boolean
}) => {
  const router = useRouter()
  const { user, userId } = useContext(UserContext)
  const [menuTheme, setMenuTheme] = useState<'dark' | undefined>('dark')
  const { resolvedTheme } = useTheme()
  const [activeMenuItemKey, setActiveMenuItemKey] = useState<
    string[] | undefined
  >(undefined)
  const [openMenuItemKey, setOpenMenuItemKey] = useState<string[] | undefined>(
    undefined,
  )
  const [visibleMenuItems, setVisibleMenuItems] = useState<ItemType[]>()

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const exploreChildren: ItemType[] = [
    {
      key: '/',
      icon: (
        <Link href="/" data-testid="nav-explore-creations">
          <Yard fontSize="small" />
        </Link>
      ),
      label: 'Creations',
    },
    {
      key: '/creators',
      icon: (
        <Link href="/creators" data-testid="nav-explore-concepts">
          <PeopleOutline fontSize="small" />
        </Link>
      ),
      label: 'Creators',
    },
    {
      key: '/concepts',
      icon: (
        <Link href="/concepts" data-testid="nav-explore-concepts">
          <ModelTraining fontSize="small" />
        </Link>
      ),
      label: 'Concepts',
    },
    ...(isPreviewUser
      ? [
          {
            key: '/characters',
            icon: (
              <Link href="/characters" data-testid="nav-explore-characters">
                <ChatBubbleOutline fontSize="small" />
              </Link>
            ),
            label: 'Characters',
          },
        ]
      : []),
  ]

  const createChildren: ItemType[] = [
    {
      key: '/create/creations',
      icon: (
        <Link href="/create/creations" data-testid="nav-create-creations">
          <Yard fontSize="small" />
        </Link>
      ),
      label: 'Creations',
    },
    {
      key: '/create/concepts',
      icon: (
        <Link href="/create/concepts" data-testid="nav-create-concepts">
          <ModelTraining fontSize="small" />
        </Link>
      ),
      label: 'Concepts',
    },
    ...(isPreviewUser
      ? [
          {
            key: '/create/characters',
            icon: (
              <Link
                href="/create/characters"
                data-testid="nav-create-characters"
              >
                <ChatBubbleOutline fontSize="small" />
              </Link>
            ),
            label: 'Characters',
          },
        ]
      : []),
  ]

  const menuItems: ItemType[] = [
    {
      type: 'divider',
      key: 'd1',
    },
    {
      key: 'explore',
      icon: (
        <div className="text-md">
          <ExploreOutlined fontSize="small" />
        </div>
      ),
      label: 'Explore',
      onTitleClick: ev => onGroupClick(ev),
      children: exploreChildren,
    },
    {
      key: 'create',
      icon: <ExperimentOutlined className="text-2xl" />,
      label: 'Create',
      onTitleClick: ev => onGroupClick(ev),
      children: createChildren,
    },
    {
      type: 'divider',
      key: 'd2',
    },
  ]
  const pathKeyMap = extractKeys(menuItems)

  useEffect(() => {
    if (user) {
      setVisibleMenuItems([
        ...menuItems,
        {
          key: '/profile',
          icon: (
            <NavMenuProfileLink
              username={user.username}
              userId={userId}
              userImage={user.userImage}
            />
          ),
          label: user.username,
        },
      ])
    } else {
      setVisibleMenuItems(menuItems)
    }
  }, [user])

  const onCloseHandler = () => {
    onClose && onClose()
  }

  useEffect(() => {
    if (router.asPath.includes(`/creators/${user?.username}`)) {
      setActiveMenuItemKey(['/profile'])
      return
    }

    const activeMenuKey = pathKeyMap.filter(pathKey => {
      return router.asPath.includes(pathKey[0])
    })[0]

    if (activeMenuKey) {
      if (activeMenuKey[1]) {
        setOpenMenuItemKey(prevState =>
          prevState
            ? !prevState.some(item => item === activeMenuKey[1])
              ? [...prevState, activeMenuKey[1]]
              : prevState
            : [activeMenuKey[1]],
        )
      }

      setActiveMenuItemKey([activeMenuKey[0]])
    }
  }, [router, user, userId])

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'light') {
      setMenuTheme(undefined)
    } else {
      setMenuTheme('dark')
    }
  }, [resolvedTheme])

  const onGroupClick = useCallback(
    (ev: { key: string }) => {
      setOpenMenuItemKey(prevState =>
        prevState
          ? !prevState.some(prevStateItem => prevStateItem === ev.key)
            ? [...prevState, ev.key]
            : prevState.filter(prev => prev !== ev.key)
          : [ev.key],
      )
    },
    [openMenuItemKey],
  )

  return (
    <Layout.Sider
      className={`!fixed overflow-auto h-full left-0 top-0 bottom-0 !bg-white dark:!bg-gray-900`}
    >
      <div className="flex flex-col h-full">
        <NavMenuHeader onClose={onCloseHandler} isVisible={isVisible} />
        <Menu
          key={router.asPath}
          className="!bg-white dark:!bg-gray-900"
          theme={menuTheme}
          mode="inline"
          defaultSelectedKeys={activeMenuItemKey}
          defaultOpenKeys={openMenuItemKey}
          selectedKeys={activeMenuItemKey}
          openKeys={openMenuItemKey}
          items={visibleMenuItems}
        />
        <div
          className="flex flex-col h-full"
          style={{ borderInlineEnd: '1px solid rgba(5, 5, 5, 0.06)' }}
        >
          <div className="mt-auto mb-4">
            <SocialLinks />
            {/*<div className="text-center text-gray-500 mb-2">Eden.art</div>*/}
            {/*<div className="flex gap-2 flex-wrap text-xs justify-center mb-2">*/}
            {/*  <a href="#">Terms of Use</a>*/}
            {/*  <span className="text-gray-500">|</span>*/}
            {/*  <a href="#">Privacy Policy</a>*/}
            {/*</div>*/}
          </div>
        </div>
      </div>
    </Layout.Sider>
  )
}

export default NavMenu
