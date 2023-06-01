import CustomLayout from '@/components/Layout/CustomLayout'
import CreationNotificationProvider from '@/providers/CreationNotificationProvider'
import UserProvider from '@/providers/UserProvider'
import WalletProvider from '@/providers/WalletProvider'
import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'antd/dist/reset.css'
import type { AppProps } from 'next/app'
import React from 'react'

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <WalletProvider>
      <UserProvider>
        <CreationNotificationProvider>
          <CustomLayout>
            <Component {...pageProps} />
          </CustomLayout>
        </CreationNotificationProvider>
      </UserProvider>
    </WalletProvider>
  )
}
