import PageLayoutDefault from '@/components/Layout/layouts/PageLayoutDefault'
import AntConfigWrapProvider from '@/providers/AntConfigWrapProvider'
import CreationNotificationProvider from '@/providers/CreationNotificationProvider'
import EdenProvider from '@/providers/EdenProvider'
import UserProvider from '@/providers/UserProvider'
import WalletProvider from '@/providers/WalletProvider'
import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'antd/dist/reset.css'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import React from 'react'

import { Page } from '../../types/page'

// this should give a better typing
type Props = AppProps & {
  Component: Page
}

export default function App({ Component, pageProps }: Props): JSX.Element {
  // use per-component layout if defined or fallback to the generic one
  const getLayout =
    Component.getLayout ||
    ((page: AppProps['pageProps']) => (
      <PageLayoutDefault>{page}</PageLayoutDefault>
    ))

  return (
    <>
      <Head>
        <title>Garden of Eden</title>
        <meta property="og:title" content="Garden of Eden" key="title" />
        <meta
          property="og:description"
          content="The Garden of Artificial Delights"
          key="title"
        />
        <meta
          property="description"
          content="The Garden of Artificial Delights"
          key="title"
        />
        <meta
          property="og:image"
          content="https://garden.eden.art/apple-touch-icon.png"
        />
        <meta
          name="viewport"
          content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>

      <ThemeProvider attribute="class">
        <AntConfigWrapProvider>
          <WalletProvider>
            <EdenProvider>
              <UserProvider>
                <CreationNotificationProvider>
                  {getLayout(<Component {...pageProps} />)}
                </CreationNotificationProvider>
              </UserProvider>
            </EdenProvider>
          </WalletProvider>
        </AntConfigWrapProvider>
      </ThemeProvider>
    </>
  )
}
