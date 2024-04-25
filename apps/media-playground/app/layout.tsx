import '@/styles/globals.css'

import { ThemeProvider } from '@/components/provider/theme-provider'
import { cn } from '@/lib/utils'
import { Inter as FontSans } from 'next/font/google'
import { ReactElement } from 'react'
import DefaultLayout from '@/components/layout/default-layout'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export default function RootLayout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Eden 2.0</title>
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DefaultLayout>
            {children}
          </DefaultLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
