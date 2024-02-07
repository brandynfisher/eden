import { UserContext } from '@/providers/UserProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { useContext, useEffect, useState } from 'react'

export enum GatedActions {
  ConceptDownload = 'ConceptDownload',
  CreationDownload = 'CreationDownload',
  MakePrivate = 'MakePrivate',
  UpscaleImage4k = 'UpscaleImage4k',
  AnimateImageLong = 'AnimateImageLong',
}

export const useSubscriptionGate = (action: GatedActions) => {
  const { hasMinimumSubscriptionTier } = useContext(UserContext)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    switch (action) {
      case GatedActions.ConceptDownload: {
        setIsAllowed(hasMinimumSubscriptionTier(SubscriptionTier.Pro))
        return
      }
      case GatedActions.MakePrivate: {
        setIsAllowed(hasMinimumSubscriptionTier(SubscriptionTier.Basic))
        return
      }
      case GatedActions.CreationDownload: {
        setIsAllowed(true)
        return
      }
      case GatedActions.AnimateImageLong: {
        // setIsAllowed(hasMinimumSubscriptionTier(SubscriptionTier.Basic))
        setIsAllowed(true) //@todo: TBD if that's premium or not
        return
      }
      case GatedActions.UpscaleImage4k: {
        // setIsAllowed(hasMinimumSubscriptionTier(SubscriptionTier.Pro))
        setIsAllowed(true) //@todo: TBD if that's premium or not
        return
      }
      default: {
        setIsAllowed(false)
        return
      }
    }
  }, [action, hasMinimumSubscriptionTier])

  return {
    isAllowed,
  }
}
