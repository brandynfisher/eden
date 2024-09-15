import '@/styles/globals.css'
import 'photoswipe/dist/photoswipe.css'

import Providers from '@/app/providers'
import Header from '@/components/header/header'
import { PreloadResources } from '@/components/preload-resources'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Toaster } from '@/components/ui/sonner'
import { env } from '@/lib/config'
import { cn } from '@/lib/utils'
import { GoogleTagManager } from '@next/third-parties/google'
import HolyLoader from 'holy-loader'
import { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { ReactNode } from 'react'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  colorScheme: 'dark light',
}

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_HOST),
  title: 'Eden Create',
  applicationName: 'Eden Create',
  description: 'The Garden of Artificial Delights',
  openGraph: {
    title: 'Eden Create',
    siteName: 'Eden Create',
    description: 'The Garden of Artificial Delights',
    type: 'website',
    images: ['/android-chrome-512x512.png'],
  },
  icons: [
    {
      rel: 'icon',
      url: '/favicon-16x16.png',
      sizes: '16x16',
      type: 'image/png',
    },
    {
      rel: 'icon',
      url: '/favicon-32x32.png',
      sizes: '32x32',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    {
      rel: 'mask-icon',
      url: '/safari-pinned-tab.svg',
    },
    {
      url: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      url: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
}

export default function RootLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PreloadResources />
      <body
        className={cn(
          'min-h-screen bg-background antialiased',
          fontSans.className,
        )}
      >
        <HolyLoader
          color="#7d2edb"
          height="1px"
          // ignoreSearchParams={true}
        />
        <Providers>
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            {modal}
            {children}
          </div>

          {env.NEXT_PUBLIC_APP_ENV === 'production' ? (
            <GoogleTagManager gtmId={env.NEXT_PUBLIC_GOOGLE_GTM_ID || ''} />
          ) : (
            <TailwindIndicator />
          )}

          <div id="modal-root" />
          <Toaster expand={false} visibleToasts={9} closeButton={true} />
        </Providers>
      </body>
    </html>
  )
}
