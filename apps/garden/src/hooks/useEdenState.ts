import { useGenerators } from '@/hooks/useGenerators'

export const useEdenState = () => {
  const { generators } = useGenerators()

  return {
    generators,
  }
}
