'use client'

import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ApiKeysCard from '@/features/account/api-keys-card'
import { useMe } from '@/hooks/use-me'
import { useAuth } from '@clerk/nextjs'
import { FeatureFlag } from '@edenlabs/eden-sdk'

const SettingsAPIPage = () => {
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isEdenAdmin = user?.featureFlags?.includes(FeatureFlag.Preview)

  if (!isEdenAdmin) {
    return <div>You are not authorized to access this feature.</div>
  }

  return (
    <>
      <TypographyH4>API Keys</TypographyH4>
      <ApiKeysCard />
    </>
  )
}

export default SettingsAPIPage
