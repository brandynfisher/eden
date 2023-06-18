import CustomLayout from '@/components/Layout/CustomLayout'
import CreationNotificationProvider from '@/providers/CreationNotificationProvider'
import EdenProvider from '@/providers/EdenProvider'
import UserProvider from '@/providers/UserProvider'
import WalletProvider from '@/providers/WalletProvider'
import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'antd/dist/reset.css'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import React from 'react'

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <ThemeProvider attribute="class">
      <WalletProvider>
        <EdenProvider>
          <UserProvider>
            <CreationNotificationProvider>
              <CustomLayout>
                <Component {...pageProps} />
              </CustomLayout>
            </CreationNotificationProvider>
          </UserProvider>
        </EdenProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}
