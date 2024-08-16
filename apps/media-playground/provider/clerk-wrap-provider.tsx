'use client'

import { env } from '@/lib/config'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import React, { ReactNode, useEffect, useState } from 'react'

const ClerkWrapProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme()
  const [baseTheme, setBaseTheme] = useState<typeof dark | undefined>(dark)
  const pathname = usePathname()

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'light') {
      setBaseTheme(undefined)
    } else {
      setBaseTheme(dark)
    }
  }, [resolvedTheme])

  const [afterSignInUrl, setAfterSignInUrl] = useState(pathname)

  useEffect(() => {
    if (pathname !== '/sign-in' && pathname !== '/sign-up') {
      setAfterSignInUrl(pathname)
    }
  }, [pathname])

  return (
    <ClerkProvider
      signInFallbackRedirectUrl={afterSignInUrl || env.NEXT_PUBLIC_HOST}
      signUpFallbackRedirectUrl={afterSignInUrl || env.NEXT_PUBLIC_HOST}
      appearance={{
        baseTheme,
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
          termsPageUrl: 'https://app.eden.art/terms',
          privacyPageUrl: 'https://app.eden.art/privacy',
          helpPageUrl: 'https://app.eden.art/help',
          logoImageUrl: 'https://app2.eden.art/eden-logo-512x512.png',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export default ClerkWrapProvider
