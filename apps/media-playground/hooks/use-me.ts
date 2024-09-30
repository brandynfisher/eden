import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import {
  CreatorsGetMeResponse,
  FeatureFlag,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'

export const useMe = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const {
    creator: currentUser,
    balance,
    foreverBalance,
    subscriptionBalance,
    isLoading,
    invalidate,
  } = useCreatorQuery({
    key: 'me',
    enabled: isAuthenticated,
  }) as unknown as CreatorsGetMeResponse

  const hasMinimumSubscriptionTier = (minimumTier: SubscriptionTier) => {
    if (!isAuthenticated || !currentUser) {
      return false
    }

    if (!currentUser.subscriptionTier && !currentUser.featureFlags) {
      return false
    }

    if (
      currentUser.subscriptionTier &&
      currentUser.subscriptionTier >= minimumTier
    ) {
      return true
    }

    return currentUser.featureFlags
      ? currentUser.featureFlags.includes(FeatureFlag.Preview)
      : false
  }

  const hasEden2EarlyAccess = () => {
    if (!isAuthenticated || !currentUser) {
      return false
    }

    return currentUser.featureFlags
      ? currentUser.featureFlags.includes(FeatureFlag.Eden2EarlyAccess)
      : false
  }

  return {
    user: currentUser,
    hasMinimumSubscriptionTier,
    hasEden2EarlyAccess,
    balance: balance as number,
    foreverBalance,
    subscriptionBalance,
    isLoading,
    invalidate: invalidate as () => Promise<void>,
  }
}
