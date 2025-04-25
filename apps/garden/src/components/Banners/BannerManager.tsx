import LegacyShutdownBanner from './LegacyShutdownBanner'
import AuthChangeBanner from '@/components/Banners/AuthChangeBanner'
import { ClerkLoaded, SignedIn, SignedOut } from '@clerk/nextjs'
import React from 'react'

const BannerManager = () => {
  return (
    <ClerkLoaded>
      <SignedIn>
        <LegacyShutdownBanner delay={2000} />
      </SignedIn>
      <SignedOut>
        <AuthChangeBanner />
      </SignedOut>
    </ClerkLoaded>
  )
}

export default BannerManager
