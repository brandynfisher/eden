import './globals.css'

import Providers from './providers'
import type { Metadata } from 'next'
import { Inter as FontSans, Roboto_Mono } from 'next/font/google'
import { ReactNode } from 'react'

const robotoMono = Roboto_Mono({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
})

const fontSans = FontSans({
  weight: '500',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Eden Watch',
  description: 'Eden Watch Companion App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${robotoMono.className} ${fontSans.className} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
