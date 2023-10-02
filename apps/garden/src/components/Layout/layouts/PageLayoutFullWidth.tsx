import CustomLayout from '@/components/Layout/CustomLayout'
import { Layout } from 'antd'
import { ReactNode } from 'react'

const { Content } = Layout

const PageLayoutFullWidth = ({ children }: { children: ReactNode }) => {
  return (
    <CustomLayout>
      <Content className="w-full">{children}</Content>
    </CustomLayout>
  )
}

export default PageLayoutFullWidth
