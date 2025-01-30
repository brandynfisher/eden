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
      signInFallbackRedirectUrl={afterSignInUrl}
      signUpFallbackRedirectUrl={afterSignInUrl}
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
