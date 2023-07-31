import CustomLayout from '@/components/Layout/CustomLayout'
import LayoutMenu from '@/components/Layout/navigation/LayoutMenu'
import { UserContext } from '@/providers/UserProvider'
import { Layout } from 'antd'
import { ReactNode, useContext } from 'react'

const { Content, Sider } = Layout

const PageLayoutDefault = ({ children }: { children: ReactNode }) => {
  const { isConnected } = useContext(UserContext)

  return (
    <CustomLayout>
      {isConnected && (
        <Sider
          width={175}
          className="mr-4 rounded-lg overflow-hidden hidden lg:block !bg-transparent"
        >
          <LayoutMenu />
        </Sider>
      )}

      <Content className="max-w-7xl mx-auto w-full">{children}</Content>
    </CustomLayout>
  )
}

export default PageLayoutDefault
