'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

export enum GatedActions {
  MakePrivate = 'MakePrivate',
}

const minimumTierMap: Record<GatedActions, SubscriptionTier> = {
  [GatedActions.MakePrivate]: SubscriptionTier.Basic,
}

export const useSubscriptionGate = (action: GatedActions) => {
  const { hasMinimumSubscriptionTier, user } = useAuthState()
  const [isAllowed, setIsAllowed] = useState(false)
  const [minimumTier, setMinimumTier] = useState<SubscriptionTier>(
    SubscriptionTier.Free,
  )
  const hasPreviewAccess = user?.featureFlags?.includes(FeatureFlag.Preview)

  useEffect(() => {
    const requiredTier = minimumTierMap[action] || SubscriptionTier.Admin // Default to Admin if action not mapped
    setMinimumTier(requiredTier)

    switch (action) {
      case GatedActions.MakePrivate: {
        setIsAllowed(
          hasMinimumSubscriptionTier(requiredTier) || !!hasPreviewAccess,
        )
        return
      }
      default: {
        setIsAllowed(false)
        return
      }
    }
  }, [action, hasMinimumSubscriptionTier, hasPreviewAccess])

  return {
    isAllowed,
    minimumSubscriptionTier: minimumTier,
  }
}
