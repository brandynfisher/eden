import { env } from '@/lib/config'
import ClerkWrapProvider from '@/provider/clerk-wrap-provider'
import { ReactQueryProvider } from '@/provider/react-query-provider'
import { ThemeProvider } from '@/provider/theme-provider'
import { WebSocketProvider } from '@/provider/websocket-provider'
import { PropsWithChildren } from 'react'

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkWrapProvider>
        <ReactQueryProvider>
          <WebSocketProvider
            endpoint={env.NEXT_PUBLIC_EDEN_COMPUTE_SOCKET_URL || ''}
          >
            {children}
          </WebSocketProvider>
        </ReactQueryProvider>
      </ClerkWrapProvider>
    </ThemeProvider>
  )
}
