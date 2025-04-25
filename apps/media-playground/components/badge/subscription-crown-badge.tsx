import { GatedActions } from '@/hooks/use-subscription-gate'
import { useSubscriptionGate } from '@/hooks/use-subscription-gate'
import { cn } from '@/lib/utils'
import { updateSubscriptionGateModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { CrownIcon } from 'lucide-react'

type Props = {
  isPublic?: boolean
  className?: string
  type: 'creation' | 'model' | 'collection' | 'agent'
}

export const SubscriptionCrownBadge = ({
  isPublic,
  type,
  className,
}: Props) => {
  const dispatch = useAppDispatch()
  const { isAllowed: isAllowedPrivacy, minimumSubscriptionTier } =
    useSubscriptionGate(GatedActions.MakePrivate)

  if (!isAllowedPrivacy && (isPublic === true || isPublic === undefined)) {
    return (
      <>
        <CrownIcon className={cn('text-orange-400 h-4 w-4', className)} />
        <div
          className="absolute inset-0 cursor-pointer z-10"
          onClick={() =>
            dispatch(
              updateSubscriptionGateModal({
                isOpen: true,
                featureName: `Making ${type}s private`,
                minimumSubscriptionTier:
                  minimumSubscriptionTier || SubscriptionTier.Basic,
              }),
            )
          }
          title={`Making ${type}s private requires a subscription`}
        />
      </>
    )
  }

  return null
}
