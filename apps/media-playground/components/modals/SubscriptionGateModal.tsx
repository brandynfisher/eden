'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthState } from '@/hooks/use-auth-state'
import { subscriptionTierNameMap } from '@/lib/strings'
import { openUserSettingsModal } from '@/lib/user-settings'
import { useSubscriptionGateModal } from '@/stores/dialogs/dialogs.selector'
import { updateSubscriptionGateModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { CrownIcon } from 'lucide-react'

function getSubscriptionTierName(tier: SubscriptionTier): string {
  return subscriptionTierNameMap[tier] || SubscriptionTier[tier]
}

export function SubscriptionGateModal() {
  const { isOpen, featureName, minimumSubscriptionTier } =
    useSubscriptionGateModal()
  const dispatch = useAppDispatch()

  const { user } = useAuthState()

  const minimumTierName = getSubscriptionTierName(minimumSubscriptionTier)
  const currentTierName = user?.subscriptionTier
    ? getSubscriptionTierName(user.subscriptionTier)
    : 'Free'

  const handleOpenSubscriptionSettings = () => {
    dispatch(
      updateSubscriptionGateModal({
        isOpen: false,
        featureName: featureName,
        minimumSubscriptionTier: minimumSubscriptionTier,
      }),
    )
    openUserSettingsModal('subscription')
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open =>
        dispatch(
          updateSubscriptionGateModal({
            isOpen: open,
            featureName: featureName,
            minimumSubscriptionTier: minimumSubscriptionTier,
          }),
        )
      }
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CrownIcon className="text-orange-400 h-5 w-5" />
            Subscription Feature
          </DialogTitle>
          <DialogDescription className="text-center pt-4" asChild>
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <strong>{featureName}</strong> is a premium feature available to
                users with the <strong>{minimumTierName}</strong> tier or
                higher.
              </div>
              <div className="text-muted-foreground mb-4">
                Your current plan:{' '}
                <strong className="capitalize">{currentTierName}</strong>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Button onClick={handleOpenSubscriptionSettings}>
            Explore Subscription Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
