import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useRouter } from 'next/router'
import React, { ReactNode, useEffect, useState } from 'react'

const ClerkWrapProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  const [afterSignInUrl, setAfterSignInUrl] = useState(router.asPath)
  useEffect(() => {
    if (router.asPath !== '/sign-in' && router.asPath !== '/sign-up') {
      setAfterSignInUrl(router.asPath)
    }
  }, [router.asPath])

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl={afterSignInUrl}
      afterSignUpUrl={afterSignInUrl}
      appearance={{
        baseTheme: dark,
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
