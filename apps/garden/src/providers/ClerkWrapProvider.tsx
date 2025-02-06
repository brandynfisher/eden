import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import React, { ReactNode } from 'react'

const ClerkWrapProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'iconButton',
          termsPageUrl: 'https://docs.eden.art/docs/overview/tos',
          privacyPageUrl: 'https://docs.eden.art/docs/overview/privacy',
          helpPageUrl: 'https://docs.eden.art/docs/category/overview',
          logoImageUrl: 'https://app.eden.art/eden-logo-512x512.png',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export default ClerkWrapProvider
