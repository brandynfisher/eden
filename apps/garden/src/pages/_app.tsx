import CustomLayout from '@/components/Layout/CustomLayout'
import LayoutMenu from '@/components/Layout/LayoutMenu'
import CreationNotificationProvider from '@/providers/CreationNotificationProvider'
import EdenProvider from '@/providers/EdenProvider'
import UserProvider from '@/providers/UserProvider'
import WalletProvider from '@/providers/WalletProvider'
import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Layout } from 'antd'
import 'antd/dist/reset.css'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import React from 'react'

import { Page } from '../../types/page'

const { Content } = Layout

// this should give a better typing
type Props = AppProps & {
  Component: Page
}
const LayoutWithMenu = ({ children }: { children: React.ReactNode }) => {
  return (
    <CustomLayout>
      <LayoutMenu />
      <Content className="flex-grow max-w-7xl mx-auto w-full">
        {children}
      </Content>
    </CustomLayout>
  )
}

export default function App({ Component, pageProps }: Props): JSX.Element {
  // use per-component layout if defined or fallback to the generic one
  const getLayout =
    Component.getLayout ||
    ((page: AppProps['pageProps']) => <LayoutWithMenu>{page}</LayoutWithMenu>)

  return (
    <ThemeProvider attribute="class">
      <WalletProvider>
        <EdenProvider>
          <UserProvider>
            <CreationNotificationProvider>
              {getLayout(<Component {...pageProps} />)}
            </CreationNotificationProvider>
          </UserProvider>
        </EdenProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}
