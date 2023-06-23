import CustomLayout from '@/components/Layout/CustomLayout'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import { Layout } from 'antd'
import React from 'react'

const { Content } = Layout

const PageLayoutDefault = ({ children }: { children: React.ReactNode }) => {
  return (
    <CustomLayout>
      <LayoutMenu />
      <Content className="flex-grow max-w-7xl mx-auto w-full">
        {children}
      </Content>
    </CustomLayout>
  )
}

export default PageLayoutDefault
