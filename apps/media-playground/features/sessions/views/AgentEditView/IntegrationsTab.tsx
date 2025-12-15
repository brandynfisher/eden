'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CaptionsDeploymentForm } from '@/features/agent/deployment-sheet/captions-deployment-form'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { EmailDeploymentForm } from '@/features/agent/deployment-sheet/email-deployment-form'
import { FarcasterDeploymentForm } from '@/features/agent/deployment-sheet/farcaster-deployment-form'
import { GmailDeploymentForm } from '@/features/agent/deployment-sheet/gmail-deployment-form'
import { GoogleCalendarDeploymentForm } from '@/features/agent/deployment-sheet/google-calendar-deployment-form'
import { InstagramDeploymentForm } from '@/features/agent/deployment-sheet/instagram-deployment-form'
import { PrintifyDeploymentForm } from '@/features/agent/deployment-sheet/printify-deployment-form'
import { ShopifyDeploymentForm } from '@/features/agent/deployment-sheet/shopify-deployment-form'
import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { TiktokDeploymentForm } from '@/features/agent/deployment-sheet/tiktok-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import {
  GatedResource,
  PREVIEW_ONLY_DEPLOYMENT_PLATFORMS,
  useGatedResource,
} from '@/hooks/use-gated-resource'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { AlertCircle, BookTextIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

type OwnerPaysOption = 'off' | 'deployments' | 'full'

export interface DeploymentSettingsHandle {
  save: () => Promise<void>
  hasUnsavedChanges: boolean
  isSaving: boolean
}

interface DeploymentSettingsInlineProps {
  agent: Agent
  onUnsavedChangesChange?: (hasChanges: boolean) => void
}

const UTILITIES_PLATFORMS: Deployment['platform'][] = [
  'tiktok',
  'instagram',
  'google_calendar',
  'shopify',
  'printify',
  'captions',
  'email',
  'gmail',
]

export const DeploymentSettingsInline = forwardRef<
  DeploymentSettingsHandle,
  DeploymentSettingsInlineProps
>(({ agent, onUnsavedChangesChange }, ref) => {
  // Convert legacy boolean values to new string format
  const getInitialValue = (): OwnerPaysOption => {
    if (typeof agent.owner_pays === 'boolean') {
      return agent.owner_pays ? 'full' : 'off'
    }
    if (
      agent.owner_pays === 'off' ||
      agent.owner_pays === 'deployments' ||
      agent.owner_pays === 'full'
    ) {
      return agent.owner_pays
    }
    return 'off'
  }

  const [ownerPays, setOwnerPays] = useState<OwnerPaysOption>(getInitialValue())
  const [savedOwnerPays, setSavedOwnerPays] = useState<OwnerPaysOption>(
    getInitialValue(),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasUnsavedChanges = useMemo(() => {
    return ownerPays !== savedOwnerPays
  }, [ownerPays, savedOwnerPays])

  // Notify parent of unsaved changes
  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges)
  }, [hasUnsavedChanges, onUnsavedChangesChange])

  const handleSave = useCallback(async () => {
    setIsSubmitting(true)
    try {
      // Send complete agent data to prevent field deletion
      const updatePayload = {
        name: agent.name,
        key: agent.username,
        description: agent.description,
        persona: agent.persona,
        public: agent.public,
        knowledge: agent.knowledge ?? '',
        greeting: agent.greeting || '',
        voice: agent.voice || '',
        models: agent.models || [],
        tools: agent.tools || {},
        llm_settings: agent.llm_settings || {},
        owner_pays: ownerPays,
      }

      await axios.patch(`/api/agents/${agent._id}`, updatePayload)
      setSavedOwnerPays(ownerPays)
      toast.success('Integration settings updated successfully', {
        description: 'Your changes have been saved.',
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to update integration settings', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [agent, ownerPays])

  // Expose imperative handle for parent to control save
  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
      hasUnsavedChanges,
      isSaving: isSubmitting,
    }),
    [handleSave, hasUnsavedChanges, isSubmitting],
  )

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Cover Usage Costs</label>
        <div className="space-y-2">
          <ToggleGroup
            type="single"
            value={ownerPays}
            onValueChange={value =>
              value && setOwnerPays(value as OwnerPaysOption)
            }
            className="flex flex-col items-stretch gap-2"
          >
            <ToggleGroupItem
              value="off"
              className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors"
            >
              <div className="font-medium text-sm">Off</div>
              <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                Users pay for their own usage.
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="deployments"
              className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors"
            >
              <div className="font-medium text-sm">Deployments only</div>
              <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                Agent owner covers all usage costs on social platforms and
                deployments only.
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="full"
              className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors"
            >
              <div className="font-medium text-sm">Full</div>
              <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                Agent owner covers all costs, including the main Eden app.
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
})

DeploymentSettingsInline.displayName = 'DeploymentSettingsInline'

interface IntegrationsTabProps {
  agent: Agent
  deployments?: Deployment[]
  isLoading?: boolean
  isError?: boolean
  onUnsavedChangesChange?: (hasChanges: boolean) => void
}

export interface IntegrationsTabHandle {
  save: () => Promise<void>
  hasUnsavedChanges: boolean
  isSaving: boolean
}

export const IntegrationsTab = forwardRef<
  IntegrationsTabHandle,
  IntegrationsTabProps
>(({ agent, deployments, isLoading, isError, onUnsavedChangesChange }, ref) => {
  const settingsRef = useRef<DeploymentSettingsHandle>(null)

  // Expose imperative handle for parent to control save
  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (settingsRef.current) {
          await settingsRef.current.save()
        }
      },
      get hasUnsavedChanges() {
        return settingsRef.current?.hasUnsavedChanges ?? false
      },
      get isSaving() {
        return settingsRef.current?.isSaving ?? false
      },
    }),
    [],
  )

  const deploymentsGate = useGatedResource(GatedResource.Deployments, {
    lockedBehavior: 'modal',
  })
  const isPreviewUser = deploymentsGate.isPreviewUser
  const showIntegration = useCallback(
    (platform: Deployment['platform']) =>
      isPreviewUser || !PREVIEW_ONLY_DEPLOYMENT_PLATFORMS.has(platform),
    [isPreviewUser],
  )

  // Always subscribe to the deployments query; seed it with any passed-in data
  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agent._id,
    initialData: deployments ? { deployments } : undefined,
    enabled: deploymentsGate.isAllowed,
  })
  const effectiveDeployments = deploymentsQuery.deployments
  const visibleDeployments = useMemo(
    () =>
      effectiveDeployments?.filter(deployment =>
        showIntegration(deployment.platform),
      ),
    [effectiveDeployments, showIntegration],
  )
  const loadingState = deploymentsQuery.isLoading || isLoading
  const errorState = deploymentsQuery.isError || isError

  const gmailDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'gmail',
  )
  const discordDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'discord',
  )
  const telegramDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'telegram',
  )
  const twitterDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'twitter',
  )
  const farcasterDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'farcaster',
  )
  const shopifyDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'shopify',
  )
  const printifyDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'printify',
  )
  const captionsDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'captions',
  )
  const emailDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'email',
  )
  const googleCalendarDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'google_calendar',
  )
  const instagramDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'instagram',
  )
  const tiktokDeployment = visibleDeployments?.find(
    deployment => deployment.platform === 'tiktok',
  )
  const shouldShowUtilities = useMemo(
    () => UTILITIES_PLATFORMS.some(showIntegration),
    [showIntegration],
  )

  if (!deploymentsGate.isAllowed) {
    return (
      <LockedFeatureBanner
        gate={deploymentsGate}
        title="Integrations are a Pro feature"
        description="Connect your agents to Discord, Telegram, Farcaster, and more with a Pro plan."
      />
    )
  }

  if (loadingState) {
    return (
      <div className="flex items-center justify-center mt-10">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  if (errorState) {
    return (
      <div className="flex items-center justify-center gap-2 mt-10">
        <AlertCircle className="size-4 text-destructive" />
        <p className="text-destructive">
          We were unable to fetch your deployments. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">
            Social Platforms
          </h2>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/70 text-purple-300"
          >
            <Link href="https://docs.eden.art/integrations" target="_blank">
              <BookTextIcon className="size-4 mr-2" />
              Integration Guide
            </Link>
          </Button>
        </div>
        <div className="space-y-4">
          <DiscordDeploymentForm
            agentId={agent._id}
            key={`discord-${discordDeployment?._id || 'new'}`}
            deployment={discordDeployment}
          />
          <TelegramDeploymentForm
            agentId={agent._id}
            key={`telegram-${telegramDeployment?._id || 'new'}`}
            deployment={telegramDeployment}
          />
          <TwitterDeploymentForm
            agentId={agent._id}
            key={`twitter-${twitterDeployment?._id || 'new'}`}
            deployment={twitterDeployment}
          />
          <FarcasterDeploymentForm
            agentId={agent._id}
            key={`farcaster-${farcasterDeployment?._id || 'new'}`}
            deployment={farcasterDeployment}
          />
        </div>
      </div>

      {shouldShowUtilities && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium text-foreground">Utilities</h2>
          <div className="space-y-4">
            {showIntegration('instagram') && (
              <InstagramDeploymentForm
                agentId={agent._id}
                key={`instagram-${instagramDeployment?._id || 'new'}`}
                deployment={instagramDeployment}
              />
            )}
            {showIntegration('tiktok') && (
              <TiktokDeploymentForm
                agentId={agent._id}
                key={`tiktok-${tiktokDeployment?._id || 'new'}`}
                deployment={tiktokDeployment}
              />
            )}
            {showIntegration('google_calendar') && (
              <GoogleCalendarDeploymentForm
                agentId={agent._id}
                key={`google_calendar-${
                  googleCalendarDeployment?._id || 'new'
                }`}
                deployment={googleCalendarDeployment}
              />
            )}
            {showIntegration('shopify') && (
              <ShopifyDeploymentForm
                agentId={agent._id}
                key={`shopify-${shopifyDeployment?._id || 'new'}`}
                deployment={shopifyDeployment}
              />
            )}
            {showIntegration('printify') && (
              <PrintifyDeploymentForm
                agentId={agent._id}
                key={`printify-${printifyDeployment?._id || 'new'}`}
                deployment={printifyDeployment}
              />
            )}
            {showIntegration('captions') && (
              <CaptionsDeploymentForm
                agentId={agent._id}
                key={`captions-${captionsDeployment?._id || 'new'}`}
                deployment={captionsDeployment}
              />
            )}
            {showIntegration('email') && (
              <EmailDeploymentForm
                agentId={agent._id}
                key={`email-${emailDeployment?._id || 'new'}`}
                deployment={emailDeployment}
              />
            )}
            {showIntegration('gmail') && gmailDeployment && (
              <GmailDeploymentForm
                agentId={agent._id}
                deployment={gmailDeployment}
              />
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium">Integration Settings</h2>
        <DeploymentSettingsInline
          ref={settingsRef}
          agent={agent}
          onUnsavedChangesChange={onUnsavedChangesChange}
        />
      </div>
    </div>
  )
})

IntegrationsTab.displayName = 'IntegrationsTab'
