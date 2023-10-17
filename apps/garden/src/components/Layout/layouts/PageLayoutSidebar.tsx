import CustomLayout from '@/components/Layout/CustomLayout'
import NavMenu from '@/components/Layout/navigation/NavMenu'
import theme from '@/styles/theme'
import { useViewportSize } from '@mantine/hooks'
import { Layout } from 'antd'
import { ReactNode, useEffect, useState } from 'react'

const { Content } = Layout

const PageLayoutSidebar = ({ children }: { children: ReactNode }) => {
  const { width: viewportWidth } = useViewportSize()
  const [isSmallScreen, setIsSmallScreen] = useState(
    viewportWidth < theme.screens.lg,
  )
  const [isVisible, setIsVisible] = useState(!isSmallScreen)
  const onCloseHandler = () => {
    setIsVisible(false)
  }

  useEffect(() => {
    if (viewportWidth < theme.screens.lg) {
      setIsSmallScreen(true)
    } else {
      setIsSmallScreen(false)
    }
  }, [viewportWidth])

  return (
    <CustomLayout>
      <Layout hasSider={!isSmallScreen}>
        {!isSmallScreen ? (
          <NavMenu isVisible={isVisible} onClose={onCloseHandler} />
        ) : null}
        <Content className={`w-full ${!isSmallScreen ? 'ml-[204px]' : ''}`}>
          {children}
        </Content>
      </Layout>
    </CustomLayout>
  )
}

export default PageLayoutSidebar
