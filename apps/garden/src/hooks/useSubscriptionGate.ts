import { UserContext } from '@/providers/UserProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { useContext, useEffect, useState } from 'react'

export enum GatedActions {
  ConceptDownload = 'ConceptDownload',
  MakePrivate = 'MakePrivate',
}

export const useSubscriptionGate = (action: GatedActions) => {
  const { hasMinimumSubscriptionTier } = useContext(UserContext)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    if (action === GatedActions.ConceptDownload) {
      setIsAllowed(hasMinimumSubscriptionTier(SubscriptionTier.Pro))
      return
    }
  }, [hasMinimumSubscriptionTier])

  return {
    isAllowed,
  }
}
