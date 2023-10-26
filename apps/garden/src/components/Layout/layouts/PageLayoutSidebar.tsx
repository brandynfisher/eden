import CustomLayout from '@/components/Layout/CustomLayout'
import NavMenu from '@/components/Layout/navigation/NavMenu'
import theme from '@/styles/theme'
import { useViewportSize } from '@mantine/hooks'
import { Layout } from 'antd'
import { ReactNode, useEffect, useState } from 'react'

const { Content } = Layout

const PageLayoutSidebar = ({
  fixedHeight,
  children,
}: {
  fixedHeight?: boolean
  children: ReactNode
}) => {
  const { width: viewportWidth } = useViewportSize()
  const [showFixedMenu, setShowFixedMenu] = useState(
    viewportWidth < theme.screens.lg,
  )
  const [isVisible, setIsVisible] = useState(showFixedMenu)
  const onCloseHandler = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    if (viewportWidth < theme.screens.lg) {
      setShowFixedMenu(false)
    } else {
      setShowFixedMenu(true)
    }
  }, [viewportWidth])

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
