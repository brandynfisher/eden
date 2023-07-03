import LayoutHeader from '@/components/Layout/LayoutHeader'
import { Layout } from 'antd'
import React, { PropsWithChildren } from 'react'

const CustomLayout = ({ children }: PropsWithChildren) => {
  return (
    <Layout className="min-h-screen flex flex-col">
      <LayoutHeader />
      <Layout className="p-4 bg-white dark:bg-gray-950">{children}</Layout>
    </Layout>
  )
}

export default CustomLayout
