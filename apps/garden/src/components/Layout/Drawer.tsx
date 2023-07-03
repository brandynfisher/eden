import HeaderLogo from '@/components/Layout/HeaderLogo'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import MainNavButtons from '@/components/Layout/MainNavButtons'
import NavBurgerButton from '@/components/Layout/NavBurgerButton'
import QuickCreateMenu from '@/components/QuickCreateMenu'
import CreationNotificationMenu from '@/components/TaskNotificationDropdown'
import { Drawer as AntDrawer, Divider } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

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
  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <MainNavButtons />
      </div>
      <Divider />
      <div className="flex justify-between items-center p-4">
        <QuickCreateMenu />
        <CreationNotificationMenu />
      </div>
      <Divider />
      <div className="flex">
        <LayoutMenu />
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
        title={<DrawerTitle onClose={onCloseHandler} isVisible={isVisible} />}
        placement="left"
        closable={false}
        onClose={onCloseHandler}
        open={isVisible}
        width={300}
      >
        <DrawerContent />
      </AntDrawer>
    </>
  )
}

export default Drawer
