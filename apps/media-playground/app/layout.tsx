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
  title: 'Garden of Eden',
  description: 'The Garden of Artificial Delights',
  openGraph: {
    title: 'Garden of Eden',
    siteName: 'Garden of Eden',
    description: 'The Garden of Artificial Delights',
    type: 'website',
    images: ['/logo-bw.png'],
  },
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
