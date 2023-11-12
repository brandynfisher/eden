import CustomLayout from '@/components/Layout/CustomLayout'
import NavMenu from '@/components/Layout/navigation/NavMenu'
import LoadingIndicator from '@/components/LoadingIndicator'
import theme from '@/styles/theme'
import { useViewportSize } from '@mantine/hooks'
import { Layout } from 'antd'
import React, { ReactNode, useEffect, useState } from 'react'

const { Content } = Layout

const PageLayoutSidebar = ({
  fixedHeight,
  children,
}: {
  fixedHeight?: boolean
  children: ReactNode
}) => {
  const { width: viewportWidth } = useViewportSize()
  const [showFixedMenu, setShowFixedMenu] = useState<boolean | undefined>(
    undefined,
  )
  const [isVisible, setIsVisible] = useState(false)
  const onCloseHandler = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    if (viewportWidth && viewportWidth < theme.screens.lg) {
      setShowFixedMenu(false)
    } else {
      setShowFixedMenu(true)
    }
  }, [viewportWidth])

  if (!viewportWidth || typeof showFixedMenu === 'undefined') {
    return (
      <div className="absolute inset-0">
        <LoadingIndicator />
      </div>
    )
  }

  return (
    <CustomLayout fixedHeight={fixedHeight}>
      <Layout hasSider={showFixedMenu}>
        {showFixedMenu ? (
          <NavMenu isVisible={isVisible} onClose={onCloseHandler} />
        ) : null}
        <Content className={`w-full ${showFixedMenu ? 'ml-[204px]' : ''}`}>
          {children}
        </Content>
      </Layout>
    </CustomLayout>
  )
}

export default PageLayoutSidebar
