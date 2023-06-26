import CustomLayout from '@/components/Layout/CustomLayout'
import { Layout } from 'antd'
import React from 'react'

const { Content } = Layout
const PageLayoutNoSidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <CustomLayout>
      <Content className="flex-grow max-w-7xl mx-auto w-full">
        {children}
      </Content>
    </CustomLayout>
  )
}
export default PageLayoutNoSidebar
