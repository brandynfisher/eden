import HeaderLogo from '@/components/Layout/HeaderLogo'
import CreationNotificationMenu from '@/components/Layout/dropdowns/TaskNotificationDropdown'
import LayoutMenu from '@/components/Layout/navigation/LayoutMenu'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import { UserContext } from '@/providers/UserProvider'
import { Drawer as AntDrawer } from 'antd'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

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
  const { isConnected, isAuthenticated } = useContext(UserContext)

  return (
    <div className="dark:!bg-gray-900">
      <div className="flex justify-between items-center p-4">
        <MainNavButtons />
      </div>

      {isConnected && isAuthenticated && (
        <div className="flex">
          <div className="flex justify-between items-center">
            <CreationNotificationMenu />
          </div>
          <LayoutMenu />
        </div>
      )}
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
        width={250}
      >
        <DrawerContent />
      </AntDrawer>
    </>
  )
}

export default Drawer
