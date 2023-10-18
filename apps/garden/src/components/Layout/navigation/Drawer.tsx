import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import NavMenu from '@/components/Layout/navigation/NavMenu'
import { Drawer as AntDrawer } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const Drawer = () => {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    router.events.on('routeChangeComplete', onCloseHandler)

    return () => {
      router.events.off('routeChangeComplete', onCloseHandler)
    }
  }, [router])

  const onCloseHandler = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div onClick={() => setIsVisible(true)}>
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
