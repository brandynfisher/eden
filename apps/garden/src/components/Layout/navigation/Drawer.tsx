import HeaderLogo from '@/components/Layout/HeaderLogo'
import MannaDropdown from '@/components/Layout/dropdowns/MannaDropdown'
import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import { UserContext } from '@/providers/UserProvider'
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { Drawer as AntDrawer, Divider } from 'antd'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const TaskNotificationDropdown = dynamic(
  () => import('@/components/Layout/dropdowns/TaskNotificationDropdown'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const DrawerTitle = ({
  onClose,
  isVisible,
}: {
  onClose: () => void
  isVisible: boolean
}) => {
  return (
    <div className="flex justify-between items-center">
      <HeaderLogo />
      <div onClick={onClose}>
        <NavBurgerButton open={isVisible} />
      </div>
    </div>
  )
}

const DrawerContent = () => {
  const { isAuthenticated } = useContext(UserContext)

  return (
    <div className="dark:!bg-gray-900">
      <div className="px-4 py-2">
        <MainNavButtons />
      </div>
      {isAuthenticated && (
        <div className="flex flex-col">
          <Divider />
          <div className="flex items-center justify-between px-3 py-2">
            <MannaDropdown />
            <TaskNotificationDropdown inDrawer={true} />
          </div>
        </div>
      )}
      <Divider />
      <div className={`flex gap-4 px-4 py-3 items-center justify-center`}>
        <a
          href="https://github.com/abraham-ai"
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
      </div>
    </div>
  )
}

const Drawer = () => {
  const router = useRouter()

  useEffect(() => {
    router.events.on('routeChangeComplete', () => {
      onCloseHandler()
    })
  }, [])

  const [isVisible, setIsVisible] = useState(false)

  const onCloseHandler = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div onClick={() => setIsVisible(true)}>
        <NavBurgerButton open={isVisible} />
      </div>
      <AntDrawer
        className="dark:!bg-gray-900"
        title={<DrawerTitle onClose={onCloseHandler} isVisible={isVisible} />}
        placement="left"
        closable={false}
        onClose={onCloseHandler}
        open={isVisible}
        width={270}
      >
        <DrawerContent />
      </AntDrawer>
    </>
  )
}

export default Drawer
