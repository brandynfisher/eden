import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import React, { ReactNode, useEffect, useState } from 'react'

const ClerkWrapProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme()
  const [baseTheme, setBaseTheme] = useState<typeof dark | undefined>(dark)
  console.log(
    'ClerkWrapProvider',
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  )

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setBaseTheme(dark)
    } else {
      setBaseTheme(undefined)
    }
  }, [resolvedTheme])

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme,
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
          termsPageUrl: 'https://app.eden.art/terms',
          privacyPageUrl: 'https://app.eden.art/privacy',
          helpPageUrl: 'https://app.eden.art/help',
          logoImageUrl: 'https://app.eden.art/eden-logo-512x512.png',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export default ClerkWrapProvider
