import { fetcher } from '@/lib/fetcher'
import { ApiKey } from '@eden-labs/eden-sdk'
import useSWR from 'swr'

export const useApiKeys = ({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) => {
  const { data, mutate: refetchApiKeys } = useSWR(
    isAuthenticated ? '/api/apikeys' : null,
    fetcher,
  )

  return {
    apiKeys: isAuthenticated ? (data?.apiKeys as ApiKey[]) : undefined,
    refetchApiKeys,
  }
}
