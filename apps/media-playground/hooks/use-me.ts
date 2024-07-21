import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'

export const useMe = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { user, balance, foreverBalance, subscriptionBalance } =
    useCreatorQuery({ key: 'me' })

  const hasMinimumSubscriptionTier = (minimumTier: SubscriptionTier) => {
    if (!isAuthenticated || !user) {
      return false
    }

    if (!user.subscriptionTier && !user.featureFlags) {
      return false
    }

    if (user.subscriptionTier && user.subscriptionTier >= minimumTier) {
      return true
    }

    return user.featureFlags
      ? user.featureFlags.includes(FeatureFlag.Preview)
      : false
  }

  return {
    user,
    hasMinimumSubscriptionTier,
    balance,
    foreverBalance,
    subscriptionBalance,
  }
}
