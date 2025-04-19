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
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { CrownIcon } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  minimumSubscriptionTier: SubscriptionTier
}

function getSubscriptionTierName(tier: SubscriptionTier): string {
  return subscriptionTierNameMap[tier] || SubscriptionTier[tier]
}

export function SubscriptionGateModal({
  open,
  onOpenChange,
  featureName,
  minimumSubscriptionTier,
}: SubscriptionGateModalProps) {
  const { user } = useAuthState()

  const minimumTierName = getSubscriptionTierName(minimumSubscriptionTier)
  const currentTierName = user?.subscriptionTier
    ? getSubscriptionTierName(user.subscriptionTier)
    : 'Free'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button asChild>
            <Link href="/settings/subscription">
              Explore Subscription Plans
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
