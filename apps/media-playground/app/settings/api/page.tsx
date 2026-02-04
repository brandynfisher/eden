'use client'

import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ApiKeysCard from '@/features/account/api-keys-card'
import { hasPreviewAccess } from '@/hooks/use-gated-resource'
import { useMe } from '@/hooks/use-me'
import { useAuth } from '@clerk/nextjs'

const SettingsAPIPage = () => {
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isEdenAdmin = hasPreviewAccess(user?.featureFlags)

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
