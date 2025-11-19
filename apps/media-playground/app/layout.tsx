import '@/styles/globals.scss'
import 'photoswipe/dist/photoswipe.css'
import 'react-farcaster-embed/dist/styles.css'

import Providers from '@/app/providers'
import CollectionSelectionDialog from '@/components/dialog/collection-selection-dialog'
import DeleteConfirmationDialog from '@/components/dialog/delete-confirmation-dialog'
import QuickAnimateDialog from '@/components/dialog/quick-animate-dialog'
import QuickUpscaleDialog from '@/components/dialog/quick-upscale-dialog'
import ShareDialog from '@/components/dialog/share-dialog'
import ConditionalHeader from '@/components/header/conditional-header'
import AppShell from '@/components/layout/app-shell'
import { SubscriptionGateModal } from '@/components/modals/SubscriptionGateModal'
import { PreloadResources } from '@/components/preload-resources'
import ScrollTopButton from '@/components/scroll-top-button'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Toaster } from '@/components/ui/sonner'
import AgentDeploymentSheet from '@/features/agent/agent-deployment-sheet'
import AgentFormSheet from '@/features/agent/agent-form-sheet'
import { env } from '@/lib/config'
import { cn } from '@/lib/utils'
import { GoogleTagManager } from '@next/third-parties/google'
import HolyLoader from 'holy-loader'
import { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { ReactNode, StrictMode } from 'react'

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
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_HOST),
  title: 'Eden',
  applicationName: 'Eden',
  description: 'Garden Of Artificial Delights',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Eden',
    siteName: 'Eden',
    description: 'Garden Of Artificial Delights',
    type: 'website',
    images: [
      'https://d14i3advvh2bvd.cloudfront.net/app/landing/logo_badge_square.png',
    ],
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
    <StrictMode>
      <html lang="en" suppressHydrationWarning className="h-full">
        <PreloadResources />
        <body
          className={cn(
            'min-h-screen h-screen bg-background antialiased overflow-hidden',
            fontSans.className,
          )}
        >
          <HolyLoader color="#9333ea" height="1px" />
          <Providers>
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
              <ConditionalHeader />
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <AppShell>
                  <>
                    {modal}
                    {children}
                  </>
                </AppShell>
              </div>
              <ScrollTopButton />
            </div>

            {env.NEXT_PUBLIC_APP_ENV === 'production' ? (
              <GoogleTagManager gtmId={env.NEXT_PUBLIC_GOOGLE_GTM_ID || ''} />
            ) : (
              <TailwindIndicator />
            )}

            <Toaster expand={false} visibleToasts={9} closeButton={true} />
            <ShareDialog />
            <CollectionSelectionDialog />
            <QuickAnimateDialog />
            <QuickUpscaleDialog />
            <DeleteConfirmationDialog />
            <AgentFormSheet />
            <AgentDeploymentSheet />
            <SubscriptionGateModal />

            <div id="modal-root" />
          </Providers>
        </body>
      </html>
    </StrictMode>
  )
}
