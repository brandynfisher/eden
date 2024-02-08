import '@/styles/globals.scss'
import 'antd/dist/reset.css'

import { Page } from '../../types/page'
import ErrorBoundary from '@/ErrorBoundary'
import PasswordProtection from '@/components/PasswordProtection'
import AntConfigWrapProvider from '@/providers/AntConfigWrapProvider'
import ClerkWrapProvider from '@/providers/ClerkWrapProvider'
import CreationNotificationProvider from '@/providers/CreationNotificationProvider'
import EdenProvider from '@/providers/EdenProvider'
import MUIConfigWrapProvider from '@/providers/MUIConfigWrapProvider'
import MasonryProvider from '@/providers/MasonryProvider'
import ModalProvider from '@/providers/ModalProvider'
import UserProvider from '@/providers/UserProvider'
import { GoogleTagManager } from '@next/third-parties/google'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import { ReactElement } from 'react'

type Props = AppProps & {
  Component: Page
}

const inter = Inter({ subsets: ['latin'] })

const PageLayoutSidebar = dynamic(
  () => import('@/components/Layout/layouts/PageLayoutSidebar'),
  { ssr: false },
)

export default function App({ Component, pageProps }: Props): ReactElement {
  // use per-component layout if defined or fallback to a generic one
  const getLayout =
    Component.getLayout ||
    ((page: AppProps['pageProps']) => (
      <PageLayoutSidebar>{page}</PageLayoutSidebar>
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
        <link rel="shortcut icon" href="/favicon.ico" />
        {/*<link rel="mask-icon" href="/icons/mask-icon.svg" color="#FFFFFF" />*/}
        <meta name="theme-color" content="#030712" />
        <meta name="background-color" content="#030712" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-startup-image"
          href="/eden-logo-512x512.png"
          sizes="640x1136"
        />
      </Head>

      <PasswordProtection>
        <main className={`${inter.className}`}>
          <ThemeProvider attribute="class">
            <MUIConfigWrapProvider>
              <AntConfigWrapProvider>
                <EdenProvider>
                  <ClerkWrapProvider>
                    <UserProvider>
                      <CreationNotificationProvider>
                        <MasonryProvider>
                          <ModalProvider>
                            {getLayout(
                              <ErrorBoundary>
                                <Component {...pageProps} />
                              </ErrorBoundary>,
                            )}
                          </ModalProvider>
                        </MasonryProvider>
                      </CreationNotificationProvider>
                    </UserProvider>
                  </ClerkWrapProvider>
                </EdenProvider>
              </AntConfigWrapProvider>
            </MUIConfigWrapProvider>
          </ThemeProvider>
        </main>
      </PasswordProtection>
      {process.env.NODE_ENV === 'production' ? (
        <GoogleTagManager gtmId="G-W4718WCZQK" />
      ) : null}
    </>
  )
}
