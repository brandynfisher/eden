'use client'

import { Button } from '@/components/ui/button'
import { GatedResourceState } from '@/hooks/use-gated-resource'
import { subscriptionTierNameMap } from '@/lib/strings'
import { openUserSettingsModal } from '@/lib/user-settings'
import { ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useMemo } from 'react'

type LockedFeatureBannerProps = {
  gate: GatedResourceState
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  onSecondaryAction?: () => void
  icon?: ReactNode
}

const LockedFeatureBanner = ({
  gate,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  icon,
}: LockedFeatureBannerProps) => {
  const tierName = useMemo(() => {
    if (gate.minimumSubscriptionTier === undefined) return undefined
    return (
      subscriptionTierNameMap[gate.minimumSubscriptionTier] ||
      gate.minimumSubscriptionTier.toString()
    )
  }, [gate.minimumSubscriptionTier])

  const handlePrimaryAction = () => {
    if (actionHref) return
    if (gate.openGate) {
      gate.openGate()
      return
    }
    openUserSettingsModal('subscription')
  }

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-left">
          <div className="mt-0.5 text-muted-foreground">
            {icon || <Lock className="h-5 w-5" />}
          </div>
          <div className="space-y-1">
            <p className="font-semibold leading-none text-foreground">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">
              {description ??
                (tierName
                  ? `Available on the ${tierName} plan or higher.`
                  : 'This feature requires a paid plan.')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:flex-row flex-col sm:items-center">
          {secondaryActionLabel &&
            (secondaryActionHref ? (
              <Button
                asChild
                variant="outline"
                className="justify-center"
                onClick={onSecondaryAction}
              >
                <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="justify-center"
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </Button>
            ))}
          {actionHref ? (
            <Button asChild className="justify-center gap-1" type="button">
              <Link href={actionHref}>
                {actionLabel || 'Upgrade'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handlePrimaryAction}
              className="justify-center gap-1"
              type="button"
            >
              {actionLabel || 'Upgrade'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LockedFeatureBanner
