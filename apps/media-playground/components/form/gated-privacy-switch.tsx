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
import {
  GatedActions,
  useSubscriptionGate,
} from '@/hooks/use-subscription-gate'
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
  const { isAllowed: canMakePrivate } = useSubscriptionGate(
    GatedActions.MakePrivate,
  )
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
            <DialogDescription>
              Upgrade your plan (or use a preview account) to keep {entityLabel}{' '}
              hidden from the public.
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
