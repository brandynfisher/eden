import LayoutHeader from '@/components/Layout/LayoutHeader'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import { Layout } from 'antd'
import React, { PropsWithChildren } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const { Content } = Layout
const CustomLayout = ({ children }: PropsWithChildren) => {
  return (
    <Layout className="min-h-screen flex flex-col">
      <LayoutHeader />
      <Layout className="flex flex-grow p-4 bg-white dark:bg-gray-950">
        <LayoutMenu />
        <Content className="flex-grow">{children}</Content>
      </Layout>
      <ToastContainer />
    </Layout>
  )
}

export default CustomLayout
