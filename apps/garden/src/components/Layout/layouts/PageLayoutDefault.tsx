import CustomLayout from '@/components/Layout/CustomLayout'
import LayoutMenu from '@/components/Layout/navigation/LayoutMenu'
import { Layout } from 'antd'

const { Content, Sider } = Layout

const PageLayoutDefault = ({ children }: { children: React.ReactNode }) => {
  return (
    <CustomLayout>
      <Sider
        width={200}
        className="mr-4 rounded-lg overflow-hidden hidden sm:block"
      >
        <LayoutMenu />
      </Sider>

      <Content className="max-w-7xl mx-auto w-full">{children}</Content>
    </CustomLayout>
  )
}

export default PageLayoutDefault
