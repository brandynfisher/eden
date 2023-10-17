import CustomLayout from '@/components/Layout/CustomLayout'
import NavMenu from '@/components/Layout/navigation/NavMenu'
import { Layout } from 'antd'
import { ReactNode } from 'react'

const { Content } = Layout

const PageLayoutSidebar = ({ children }: { children: ReactNode }) => {
  return (
    <CustomLayout>
      {/*<Layout hasSider={true}>*/}
      {/*<div className="flex w-screen h-full">*/}
      <NavMenu />
      <Content className="w-full ml-[204px]">{children}</Content>
      {/*</div>*/}
      {/*</Layout>*/}
    </CustomLayout>
  )
}

export default PageLayoutSidebar
