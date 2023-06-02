import LayoutHeader from '@/components/Layout/LayoutHeader'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import { Layout, theme } from 'antd'
import React, { PropsWithChildren } from 'react'

const { Content } = Layout
const CustomLayout = ({ children }: PropsWithChildren) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <Layout>
      <LayoutHeader />
      <Layout>
        <LayoutMenu />
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default CustomLayout
