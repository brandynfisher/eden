import HeaderLogo from '@/components/Layout/HeaderLogo'
import MannaDropdown from '@/components/Layout/dropdowns/MannaDropdown'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import SocialLinks from '@/components/Layout/navigation/SocialLinks'
import LoadingIndicator from '@/components/LoadingIndicator'
import { UserContext } from '@/providers/UserProvider'
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
        <MainNavButtons inDrawer={true} />
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
      <SocialLinks />
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
