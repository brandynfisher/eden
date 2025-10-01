import { env } from '@/lib/config'
import { DailyLoginProvider } from '@/providers/daily-login-provider'
import { NotificationProvider } from '@/providers/notification-provider'
import { ReactQueryProvider } from '@/providers/react-query-provider'
import ReduxProvider from '@/providers/redux-provider'
import { TaskStatusProvider } from '@/providers/task-status-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { WebSocketProvider } from '@/providers/websocket-provider'
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
            termsPageUrl: 'https://docs.eden.art/legal/tos',
            privacyPageUrl: 'https://docs.eden.art/legal/privacy',
            helpPageUrl: 'https://docs.eden.art/',
            logoImageUrl: `${env.NEXT_PUBLIC_HOST}/android-chrome-512x512.png`,
          },
        }}
      >
        <ReactQueryProvider>
          <WebSocketProvider
            endpoint={env.NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL || ''}
          >
            <ReduxProvider>
              <TaskStatusProvider>
                <NotificationProvider>
                  <DailyLoginProvider>{children}</DailyLoginProvider>
                </NotificationProvider>
              </TaskStatusProvider>
            </ReduxProvider>
          </WebSocketProvider>
        </ReactQueryProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
