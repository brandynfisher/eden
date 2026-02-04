import { FeatureFlag } from '@edenlabs/eden-sdk'

export const PREVIEW_ACCESS_FEATURE_FLAGS = new Set<FeatureFlag>([
  FeatureFlag.Preview,
  FeatureFlag.MarsCollege26,
])

export const hasPreviewAccess = (featureFlags?: FeatureFlag[]) =>
  !!featureFlags?.some(flag => PREVIEW_ACCESS_FEATURE_FLAGS.has(flag))
