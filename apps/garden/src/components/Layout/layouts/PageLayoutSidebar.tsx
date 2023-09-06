import CustomLayout from '@/components/Layout/CustomLayout'
import LayoutMenu from '@/components/Layout/navigation/LayoutMenu'
import { UserContext } from '@/providers/UserProvider'
import { Layout } from 'antd'
import { ReactNode, useContext } from 'react'

const { Content, Sider } = Layout
const PageLayoutSidebar = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useContext(UserContext)

  return (
    <CustomLayout>
      {isAuthenticated && (
        <Sider width={175} className="mr-4 hidden lg:block !bg-transparent">
          <div className="rounded-lg overflow-hidden sticky top-4">
            <LayoutMenu />
          </div>
        </Sider>
      )}

      <Content className="max-w-7xl mx-auto w-full">{children}</Content>
    </CustomLayout>
  )
}

export default PageLayoutSidebar
