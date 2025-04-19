'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

export enum GatedActions {
  MakePrivate = 'MakePrivate',
}

const minimumTierMap: Record<GatedActions, SubscriptionTier> = {
  [GatedActions.MakePrivate]: SubscriptionTier.Basic,
}

export const useSubscriptionGate = (action: GatedActions) => {
  const { hasMinimumSubscriptionTier } = useAuthState()
  const [isAllowed, setIsAllowed] = useState(false)
  const [minimumTier, setMinimumTier] = useState<SubscriptionTier>(
    SubscriptionTier.Free,
  )

  useEffect(() => {
    const requiredTier = minimumTierMap[action] || SubscriptionTier.Admin // Default to Admin if action not mapped
    setMinimumTier(requiredTier)

    switch (action) {
      case GatedActions.MakePrivate: {
        setIsAllowed(hasMinimumSubscriptionTier(requiredTier))
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
    minimumSubscriptionTier: minimumTier,
  }
}
