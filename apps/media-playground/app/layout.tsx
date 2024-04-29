import '@/styles/globals.css'

import { GoogleTagManager } from '@next/third-parties/google'
import { ThemeProvider } from '@/components/provider/theme-provider'
import { cn } from '@/lib/utils'
import { Inter as FontSans } from 'next/font/google'
import { ReactElement } from 'react'
import Header from '@/components/header/header'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export default function RootLayout({ children }: { children: ReactElement }) {
  return (
    <html lang='en' suppressHydrationWarning>
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
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <div className='flex min-h-screen w-full flex-col'>
            <Header />
            {children}
          </div>
          {process.env.NODE_ENV === 'production' ? (
            <GoogleTagManager gtmId="G-W4718WCZQK" />
          ) : null}
        </ThemeProvider>
      </body>
    </html>
  )
}
