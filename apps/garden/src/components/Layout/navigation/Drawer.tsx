import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import NavMenu from '@/components/Layout/navigation/NavMenu'
import { Drawer as AntDrawer } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const Drawer = () => {
  const router = useRouter()

  useEffect(() => {
    router.events.on('routeChangeComplete', () => {
      onCloseHandler()
    })
  }, [])

  const [isVisible, setIsVisible] = useState(false)

  const onCloseHandler = () => {
    setIsVisible(!isVisible)
  }

  return (
    <>
      <div onClick={onCloseHandler}>
        <NavBurgerButton open={isVisible} />
      </div>
      <AntDrawer
        placement="left"
        closable={false}
        onClose={onCloseHandler}
        open={isVisible}
        width={200}
        className="h-full"
      >
        <NavMenu onClose={onCloseHandler} isVisible={isVisible} />
      </AntDrawer>
    </>
  )
}

export default Drawer
