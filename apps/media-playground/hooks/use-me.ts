import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { CreatorsGetMeResponse, SubscriptionTier } from '@edenlabs/eden-sdk'
import isNumber from 'lodash/isNumber'

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

    const hasSubscriptionTier = isNumber(currentUser.subscriptionTier)

    if (!hasSubscriptionTier) {
      return false
    }

    if (hasSubscriptionTier && currentUser.subscriptionTier! >= minimumTier) {
      return true
    }

    return false
  }

  return {
    user: currentUser,
    hasMinimumSubscriptionTier,
    balance: balance as number,
    foreverBalance,
    subscriptionBalance,
    isLoading,
    invalidate: invalidate as () => Promise<void>,
  }
}
