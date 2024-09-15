import { env } from '@/lib/config'
import { ReactQueryProvider } from '@/provider/react-query-provider'
import { ThemeProvider } from '@/provider/theme-provider'
import { WebSocketProvider } from '@/provider/websocket-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { PropsWithChildren } from 'react'

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider
        appearance={{
          baseTheme: dark,
          layout: {
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'iconButton',
            termsPageUrl: 'https://app.eden.art/terms',
            privacyPageUrl: 'https://app.eden.art/privacy',
            helpPageUrl: 'https://app.eden.art/help',
            logoImageUrl: `${env.NEXT_PUBLIC_HOST}/android-chrome-512x512.png`,
          },
        }}
      >
        <ReactQueryProvider>
          <WebSocketProvider
            endpoint={env.NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL || ''}
          >
            {children}
          </WebSocketProvider>
        </ReactQueryProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
