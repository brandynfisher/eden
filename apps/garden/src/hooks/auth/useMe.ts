import { fetcher } from '@/lib/fetcher'
import { useAuth } from '@clerk/nextjs'
import { Creator, FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import useSWR from 'swr'

export const useMe = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { getToken } = useAuth()
  const route = '/api/me'

  const { data, mutate } = useSWR(isAuthenticated ? route : null, async () =>
    fetcher(route, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    }),
  )

  const hasMinimumSubscriptionTier = (minimumTier: SubscriptionTier) => {
    if (!isAuthenticated || !data?.creator) {
      return false
    }

    if (!data?.creator.subscriptionTier && !data?.creator.featureFlags) {
      return false
    }

    if (
      data?.creator.subscriptionTier &&
      data?.creator.subscriptionTier >= minimumTier
    ) {
      return true
    }

    return data?.creator.featureFlags
      ? data?.creator.featureFlags.includes(FeatureFlag.Preview)
      : false
  }

  return {
    user: isAuthenticated ? (data?.creator as Creator) : undefined,
    hasMinimumSubscriptionTier,
    balance: isAuthenticated ? data?.balance : undefined,
    foreverBalance: isAuthenticated ? data?.foreverBalance : undefined,
    subscriptionBalance: isAuthenticated
      ? data?.subscriptionBalance
      : undefined,
    pendingTasks: isAuthenticated ? data?.pendingTasks : undefined,
    refetchMe: mutate,
  }
}
