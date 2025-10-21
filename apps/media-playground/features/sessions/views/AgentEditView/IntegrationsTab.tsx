'use client'

import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CaptionsDeploymentForm } from '@/features/agent/deployment-sheet/captions-deployment-form'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { FarcasterDeploymentForm } from '@/features/agent/deployment-sheet/farcaster-deployment-form'
import { PrintifyDeploymentForm } from '@/features/agent/deployment-sheet/printify-deployment-form'
import { ShopifyDeploymentForm } from '@/features/agent/deployment-sheet/shopify-deployment-form'
import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { TiktokDeploymentForm } from '@/features/agent/deployment-sheet/tiktok-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { AlertCircle, Loader2 } from 'lucide-react'
import { FC, useState } from 'react'
import { toast } from 'sonner'

type OwnerPaysOption = 'off' | 'deployments' | 'full'

export const DeploymentSettingsInline: FC<{ agent: Agent }> = ({ agent }) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
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
  }

  return (
    <div className="space-y-4">
      <div className="bg-background border p-4 rounded-lg">
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting} type="button">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  )
}

interface IntegrationsTabProps {
  agent: Agent
  deployments?: Deployment[]
  isLoading?: boolean
  isError?: boolean
}

export const IntegrationsTab: FC<IntegrationsTabProps> = ({
  agent,
  deployments,
  isLoading,
  isError,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  if (isError) {
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
    <div className="space-y-6">
      <div>
        {/* Social Platforms Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-foreground">
            Social Platforms
          </h2>
          <div className="space-y-4">
            <DiscordDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'discord',
              )}
            />
            <TelegramDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'telegram',
              )}
            />
            <TwitterDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'twitter',
              )}
            />
            <TiktokDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'tiktok',
              )}
            />
            <FarcasterDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'farcaster',
              )}
            />
          </div>
        </div>

        {/* Utilities Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-foreground">
            Utilities
          </h2>
          <div className="space-y-4">
            <ShopifyDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'shopify',
              )}
            />
            <PrintifyDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'printify',
              )}
            />
            <CaptionsDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'captions',
              )}
            />
          </div>
        </div>

        {/* Integration Settings - Inline version to avoid form nesting */}
        <div className="mt-8 space-y-4 rounded-lg">
          <h2 className="text-lg font-medium">Integration Settings</h2>
          <DeploymentSettingsInline agent={agent} />
        </div>
      </div>
    </div>
  )
}
