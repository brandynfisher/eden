'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  GatedActions,
  useSubscriptionGate,
} from '@/hooks/use-subscription-gate'
import { subscriptionTierNameMap } from '@/lib/strings'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

type Props = {
  checked: boolean
  onCheckedChange: (value: boolean) => void
  disabled?: boolean
  subscriptionUrl?: string
  entityLabel?: string
}

const DEFAULT_SUBSCRIPTION_URL = 'http://localhost:3000/settings/subscription'

const GatedPrivacySwitch = ({
  checked,
  onCheckedChange,
  disabled,
  subscriptionUrl = DEFAULT_SUBSCRIPTION_URL,
  entityLabel = 'agents',
}: Props) => {
  const { isAllowed: canMakePrivate, minimumSubscriptionTier } =
    useSubscriptionGate(GatedActions.MakePrivate)
  const { user } = useAuthState()
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const requiredTierName =
    subscriptionTierNameMap[minimumSubscriptionTier] ||
    SubscriptionTier[minimumSubscriptionTier] ||
    'your current plan'
  const currentTierName = user?.subscriptionTier
    ? subscriptionTierNameMap[user.subscriptionTier] ||
      SubscriptionTier[user.subscriptionTier]
    : 'Free'

  const handleChange = useCallback(
    (nextValue: boolean) => {
      if (!nextValue && !canMakePrivate) {
        setIsDialogOpen(true)
        return
      }
      onCheckedChange(nextValue)
    },
    [canMakePrivate, onCheckedChange],
  )

  const handleSubscribe = () => {
    setIsDialogOpen(false)
    if (subscriptionUrl.startsWith('http')) {
      window.location.href = subscriptionUrl
    } else {
      router.push(subscriptionUrl)
    }
  }

  return (
    <>
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Private {entityLabel} require a subscription
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                This feature needs the <strong>{requiredTierName}</strong> tier
                or higher.
              </p>
              <p>
                Your current plan:{' '}
                <strong className="capitalize">{currentTierName}</strong>
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Maybe later
            </Button>
            <Button onClick={handleSubscribe}>
              Go to subscription settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default GatedPrivacySwitch
