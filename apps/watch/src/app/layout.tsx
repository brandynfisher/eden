import './globals.css'

import { AuthProvider } from '@/contexts/auth-context'
import { QueryProvider } from '@/providers/query-provider'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Eden.art Watch',
  description: 'Watch your creations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} antialiased min-h-screen`}>
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
