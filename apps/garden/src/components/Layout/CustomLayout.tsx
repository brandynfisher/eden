import LayoutHeader from '@/components/Layout/LayoutHeader'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import { Layout, theme } from 'antd'
import React, { PropsWithChildren } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const { Content } = Layout
const CustomLayout = ({ children }: PropsWithChildren) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <Layout className="min-h-screen flex flex-col">
      <LayoutHeader />
      <Layout className="flex flex-grow">
        <LayoutMenu />
        <Content
          className="flex-grow p-4"
          style={{ background: colorBgContainer }}
        >
          {children}
        </Content>
      </Layout>
      <ToastContainer />
    </Layout>
  )
}

export default CustomLayout
