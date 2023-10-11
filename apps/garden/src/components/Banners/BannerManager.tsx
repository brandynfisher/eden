import AccountMigrationBanner from '@/components/Banners/AccountMigrationBanner'
import AuthChangeBanner from '@/components/Banners/AuthChangeBanner'
import { ClerkLoaded, SignedIn, SignedOut } from '@clerk/nextjs'
import React from 'react'

const BannerManager = () => {
  return (
    <ClerkLoaded>
      <SignedIn>
        <AccountMigrationBanner />
      </SignedIn>
      <SignedOut>
        <AuthChangeBanner />
      </SignedOut>
    </ClerkLoaded>
  )
}

export default BannerManager
