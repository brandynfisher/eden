'use client'

import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { SubscriptionTier } from '@edenlabs/eden-sdk'

export enum GatedActions {
  MakePrivate = 'MakePrivate',
}

const actionResourceMap: Record<GatedActions, GatedResource> = {
  [GatedActions.MakePrivate]: GatedResource.MakePrivate,
}

export const useSubscriptionGate = (action: GatedActions) => {
  const resource = actionResourceMap[action]

  const { isAllowed, minimumSubscriptionTier } = useGatedResource(resource, {
    lockedBehavior: 'modal',
  })

  return {
    isAllowed,
    minimumSubscriptionTier: minimumSubscriptionTier ?? SubscriptionTier.Free,
  }
}
