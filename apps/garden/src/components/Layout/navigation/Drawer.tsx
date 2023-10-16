import HeaderLogo from '@/components/Layout/HeaderLogo'
import MainNavButtons from '@/components/Layout/navigation/MainNavButtons'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import SocialLinks from '@/components/Layout/navigation/SocialLinks'
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
    <div className="dark:!bg-gray-900">
      <div className="px-4 py-2">
        <MainNavButtons inDrawer={true} />
      </div>
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
