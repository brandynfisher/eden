import CustomLayout from '@/components/Layout/CustomLayout'
import { Layout } from 'antd'
import { ReactNode } from 'react'

const { Content } = Layout

const PageLayoutDefault = ({ children }: { children: ReactNode }) => {
  return (
    <CustomLayout>
      <Content className="max-w-7xl mx-auto w-full">{children}</Content>
    </CustomLayout>
  )
}

export default PageLayoutDefault
