import { UserContext } from '@/providers/UserProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { useContext, useEffect, useState } from 'react'

export enum GatedActions {
  ConceptDownload = 'ConceptDownload',
  CreationDownload = 'CreationDownload',
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

    if (action === GatedActions.CreationDownload) {
      setIsAllowed(true)
      return
    }
  }, [hasMinimumSubscriptionTier])

  return {
    isAllowed,
  }
}
