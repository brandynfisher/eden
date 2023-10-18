import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import HeaderLogo from '@/components/Layout/HeaderLogo'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import SocialLinks from '@/components/Layout/navigation/SocialLinks'
import { UserContext } from '@/providers/UserProvider'
import CommentOutlined from '@ant-design/icons/CommentOutlined'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
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

const NavMenuHeader = ({
  onClose,
  isVisible,
}: {
  onClose: () => void
  isVisible: boolean
}) => {
  return (
    <div
      className="flex justify-between items-center py-4 pl-4 pr-1 h-[64px]"
      style={{ borderInlineEnd: '1px solid rgba(5, 5, 5, 0.06)' }}
    >
      <HeaderLogo />
      <div
        className={`block lg:hidden transition-opacity delay-75 duration-75 ${
          !isVisible ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      >
        <NavBurgerButton open={isVisible} />
      </div>
    </div>
  )
}

const ProfileLink = ({
  userId,
  username,
  userImage,
}: {
  userId: string | null
  username: string | undefined
  userImage: string | undefined
}) => {
  return (
    <Link
      href={username ? `/creators/${username?.toLowerCase()}` : '/'}
      passHref
      className="font-mono flex justify-center items-center h-[32px] w-[32px] mr-2"
    >
      <CharacterAvatar
        id={userId || ''}
        name={username || ''}
        imageUri={userImage || ''}
        size={'small'}
        shape="circle"
      />
    </Link>
  )
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

  const menuItems: ItemType[] = [
    // {
    //   key: 'home',
    //   icon: <HomeOutlined fontSize="medium" />,
    //   label: 'Home',
    // },
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
      children: [
        {
          key: '/',
          icon: (
            <Link href="/">
              <Yard fontSize="small" />
            </Link>
          ),
          label: 'Creations',
        },
        {
          key: '/concepts',
          icon: (
            <Link href="/concepts">
              <ModelTraining fontSize="small" />
            </Link>
          ),
          label: 'Concepts',
        },
      ],
    },
    {
      key: 'create',
      icon: <ExperimentOutlined className="text-2xl" />,
      label: 'Create',
      onTitleClick: ev => onGroupClick(ev),
      children: [
        {
          key: '/create/creations',
          icon: (
            <Link href="/create/creations">
              <Yard fontSize="small" />
            </Link>
          ),
          label: 'Creations',
        },
        {
          key: '/create/concepts',
          icon: (
            <Link href="/create/concepts">
              <ModelTraining fontSize="small" />
            </Link>
          ),
          label: 'Concepts',
        },
        {
          key: '/create/characters',
          icon: <RobotOutlined />,
          label: 'Characters',
          disabled: true,
        },
        {
          key: '/create/scenarios',
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
  ]
  const pathKeyMap = extractKeys(menuItems)

  useEffect(() => {
    if (user && userId) {
      setVisibleMenuItems([
        ...menuItems,
        {
          key: '/profile',
          icon: (
            <ProfileLink
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
  }, [user, userId])

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
    if (resolvedTheme && resolvedTheme === 'dark') {
      setMenuTheme('dark')
    } else {
      setMenuTheme(undefined)
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

  if (!activeMenuItemKey || !openMenuItemKey) {
    return null
  }

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
          <div className="mt-auto">
            <SocialLinks />
            <div className="text-center text-gray-500">EdenLabs ©2023</div>
            <div className="flex gap-2 flex-wrap text-xs justify-center my-2">
              <a href="#">Terms of Use</a>
              <span className="text-gray-500">|</span>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </Layout.Sider>
  )
}

export default NavMenu
