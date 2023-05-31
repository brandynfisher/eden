import CustomLayout from '@/components/Layout/CustomLayout'
import UserProvider from '@/providers/UserProvider'
import WalletProvider from '@/providers/WalletProvider'
import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { AppProps } from 'next/app'
import React from 'react'

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <WalletProvider>
      <UserProvider>
        <CustomLayout>
          <Component {...pageProps} />
        </CustomLayout>
      </UserProvider>
    </WalletProvider>
  )
}
