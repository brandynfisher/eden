import LayoutHeader from '@/components/Layout/LayoutHeader'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import { ConfigProvider, Layout, theme as antdTheme } from 'antd'
import { useTheme } from 'next-themes'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const { Content } = Layout1

const CustomLayout = ({ children }: PropsWithChildren) => {
  const { resolvedTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setIsDarkMode(true)
    } else {
      setIsDarkMode(false)
    }
  }, [resolvedTheme])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode
          ? [antdTheme.darkAlgorithm]
          : [antdTheme.defaultAlgorithm],
      }}
    >
      <Layout className="min-h-screen flex flex-col">
        <LayoutHeader />
        <Layout className="flex flex-grow p-4 bg-white dark:bg-gray-950">
          <LayoutMenu />
          <Content className="flex-grow">{children}</Content>
        </Layout>
        <ToastContainer />
      </Layout>
    </ConfigProvider>
  )
}

export default CustomLayout
