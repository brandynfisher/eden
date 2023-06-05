import { fetcher } from '@/lib/fetcher'
import useSWR from 'swr'

export const useGeneratorInfo = (generatorName: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/generators/${generatorName}`,
    fetcher,
  )

  if (isLoading || !data || error) {
    return {
      description: '',
      versionId: 'loading',
      requiredParameters: [],
      optionalParameters: [],
      isLoading,
      error,
      mutate,
    }
  }

  const requiredParameters = data?.generatorVersion?.parameters.filter(
    (parameter: { optional: boolean }) => !parameter.optional,
  )

  const optionalParameters = data?.generatorVersion?.parameters.filter(
    (parameter: { optional: boolean }) => parameter.optional,
  )

  return {
    description: data?.generatorVersion?.description || '',
    versionId: data?.generatorVersion?.versionId || '',
    requiredParameters: requiredParameters || [],
    optionalParameters: optionalParameters || [],
    isLoading,
    error,
    mutate,
  }
}
