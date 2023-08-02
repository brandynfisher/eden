export interface FeatureFlags {
  charactersEnabled: boolean
}

export const useFeatureFlags = () => {
  const charactersEnabled =
    process.env.NEXT_PUBLIC_FLAG_CHARACTERS_ENABLED === 'true'

  return {
    charactersEnabled,
  }
}
