'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { updateSubscriptionGateModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'

export const PREVIEW_ACCESS_FEATURE_FLAGS = new Set<FeatureFlag>([
  FeatureFlag.Preview,
  FeatureFlag.MarsCollege26,
])

// Preview-only deployment platforms (anything not explicitly stable)
export const PREVIEW_ONLY_DEPLOYMENT_PLATFORMS = new Set<string>([
  'tiktok',
  'instagram',
])

export enum GatedResource {
  AddAgent = 'AddAgent',
  MakePrivate = 'MakePrivate',
  Tasks = 'Tasks',
  UserMemory = 'UserMemory',
  CollectiveMemory = 'CollectiveMemory',
  AgentPermissions = 'AgentPermissions',
  Deployments = 'Deployments',
  ApiKeys = 'ApiKeys',
  GigabrainTools = 'GigabrainTools',
}

type LockedBehavior = 'hide' | 'modal'

type PreviewGateConfig = {
  type: 'preview'
  featureFlag: FeatureFlag
  additionalFeatureFlags?: FeatureFlag[]
  lockedBehavior?: LockedBehavior
}

type SubscriptionGateConfig = {
  type: 'subscription'
  featureName: string
  minimumSubscriptionTier: SubscriptionTier
  allowPreviewFlag?: FeatureFlag
  lockedBehavior?: LockedBehavior
}

type GateConfig = PreviewGateConfig | SubscriptionGateConfig

const gatedResourceConfig: Record<GatedResource, GateConfig> = {
  [GatedResource.AddAgent]: {
    type: 'preview',
    featureFlag: FeatureFlag.Preview,
    lockedBehavior: 'hide',
  },
  [GatedResource.MakePrivate]: {
    type: 'subscription',
    featureName: 'Making items private',
    minimumSubscriptionTier: SubscriptionTier.Basic,
    allowPreviewFlag: FeatureFlag.Preview,
    lockedBehavior: 'modal',
  },
  [GatedResource.Tasks]: {
    type: 'subscription',
    featureName: 'Automated tasks',
    minimumSubscriptionTier: SubscriptionTier.Basic,
    lockedBehavior: 'modal',
  },
  [GatedResource.UserMemory]: {
    type: 'subscription',
    featureName: 'User memory',
    minimumSubscriptionTier: SubscriptionTier.Free,
    lockedBehavior: 'modal',
  },
  [GatedResource.CollectiveMemory]: {
    type: 'subscription',
    featureName: 'Collective memory',
    minimumSubscriptionTier: SubscriptionTier.Basic,
    allowPreviewFlag: FeatureFlag.Preview,
    lockedBehavior: 'modal',
  },
  [GatedResource.AgentPermissions]: {
    type: 'subscription',
    featureName: 'Agent permissions and sharing',
    minimumSubscriptionTier: SubscriptionTier.Basic,
    lockedBehavior: 'modal',
  },
  [GatedResource.Deployments]: {
    type: 'subscription',
    featureName: 'Agent deployments',
    minimumSubscriptionTier: SubscriptionTier.Pro,
    lockedBehavior: 'modal',
  },
  [GatedResource.ApiKeys]: {
    type: 'preview',
    featureFlag: FeatureFlag.ApiKeyAccess,
    additionalFeatureFlags: [FeatureFlag.EdenAdmin],
    lockedBehavior: 'modal',
  },
  [GatedResource.GigabrainTools]: {
    type: 'subscription',
    featureName: 'Gigabrain tools',
    minimumSubscriptionTier: SubscriptionTier.Pro,
    lockedBehavior: 'modal',
  },
}

type UseGatedResourceOptions = {
  lockedBehavior?: LockedBehavior
  featureName?: string
  minimumSubscriptionTier?: SubscriptionTier
  allowPreviewFlag?: FeatureFlag
}

export const useGatedResource = (
  resource: GatedResource,
  options?: UseGatedResourceOptions,
) => {
  const dispatch = useAppDispatch()
  const { user, hasMinimumSubscriptionTier } = useAuthState()
  const baseConfig = gatedResourceConfig[resource]

  const lockedBehavior: LockedBehavior =
    options?.lockedBehavior ||
    baseConfig.lockedBehavior ||
    (baseConfig.type === 'preview' ? 'hide' : 'modal')

  const previewFlag =
    baseConfig.type === 'subscription'
      ? baseConfig.allowPreviewFlag
      : baseConfig.featureFlag
  const hasGlobalPreviewFlag = !!user?.featureFlags?.some(flag =>
    PREVIEW_ACCESS_FEATURE_FLAGS.has(flag as FeatureFlag),
  )
  const isPreviewUser =
    hasGlobalPreviewFlag ||
    (previewFlag ? !!user?.featureFlags?.includes(previewFlag) : false)

  let isAllowed = false
  let minimumSubscriptionTier: SubscriptionTier | undefined
  let featureName: string | undefined

  if (baseConfig.type === 'preview') {
    const hasFlag =
      hasGlobalPreviewFlag ||
      !!user?.featureFlags?.includes(baseConfig.featureFlag)
    const hasAdditionalFlag = baseConfig.additionalFeatureFlags
      ? baseConfig.additionalFeatureFlags.some(flag =>
          user?.featureFlags?.includes(flag),
        )
      : false
    isAllowed = hasFlag
    if (!isAllowed && hasAdditionalFlag) {
      isAllowed = true
    }
  } else {
    const resolvedMinimumTier =
      options?.minimumSubscriptionTier ?? baseConfig.minimumSubscriptionTier
    minimumSubscriptionTier = resolvedMinimumTier
    featureName = options?.featureName || baseConfig.featureName
    const allowPreviewFlag =
      options?.allowPreviewFlag || baseConfig.allowPreviewFlag
    const hasRequiredTier = hasMinimumSubscriptionTier(resolvedMinimumTier)
    const hasAllowedPreview = allowPreviewFlag
      ? !!user?.featureFlags?.includes(allowPreviewFlag)
      : false
    isAllowed = hasRequiredTier || hasAllowedPreview || hasGlobalPreviewFlag
  }

  const shouldRender = isAllowed || lockedBehavior !== 'hide'

  const openGate = () => {
    if (baseConfig.type !== 'subscription') return
    if (lockedBehavior !== 'modal') return

    dispatch(
      updateSubscriptionGateModal({
        isOpen: true,
        featureName: featureName || baseConfig.featureName,
        minimumSubscriptionTier:
          minimumSubscriptionTier || baseConfig.minimumSubscriptionTier,
      }),
    )
  }

  return {
    isAllowed,
    shouldRender,
    lockedBehavior,
    gatingType: baseConfig.type,
    featureName,
    minimumSubscriptionTier,
    isPreviewUser,
    openGate,
  }
}

export type GatedResourceState = ReturnType<typeof useGatedResource>
