import { env } from '@/lib/config'
import { NotificationProvider } from '@/providers/notification-provider'
import { ReactQueryProvider } from '@/providers/react-query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { PropsWithChildren } from 'react'

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider
        dynamic
        appearance={{
          baseTheme: dark,
          layout: {
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'iconButton',
            termsPageUrl: 'https://docs.eden.art/docs/overview/tos',
            privacyPageUrl: 'https://docs.eden.art/docs/overview/privacy',
            helpPageUrl: 'https://docs.eden.art/docs/category/overview',
            logoImageUrl: `${env.NEXT_PUBLIC_HOST}/android-chrome-512x512.png`,
          },
        }}
      >
        <ReactQueryProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ReactQueryProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
