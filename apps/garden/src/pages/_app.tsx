import PageLayoutDefault from '@/components/Layout/layouts/PageLayoutDefault'
import AntConfigWrapProvider from '@/providers/AntConfigWrapProvider'
import CreationNotificationProvider from '@/providers/CreationNotificationProvider'
import EdenProvider from '@/providers/EdenProvider'
import UserProvider from '@/providers/UserProvider'
import WalletProvider from '@/providers/WalletProvider'
import '@/styles/globals.scss'
import '@rainbow-me/rainbowkit/styles.css'
import 'antd/dist/reset.css'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { ReactElement } from 'react'

import { Page } from '../../types/page'

type Props = AppProps & {
  Component: Page
}

export default function App({ Component, pageProps }: Props): ReactElement {
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
        <meta
          property="description"
          content="The Garden of Artificial Delights"
        />
        <meta property="og:title" key="title" content="Garden of Eden" />
        <meta
          property="og:description"
          content="The Garden of Artificial Delights"
          key="description"
        />
        <meta
          property="og:image"
          content="https://app.eden.art/apple-touch-icon.png"
          key="image"
        />
        <meta property="og:site_name" content="Garden of Eden" />
        <meta
          name="viewport"
          content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta property="og:type" content="website" />
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
