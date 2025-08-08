'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CaptionsDeploymentForm } from '@/features/agent/deployment-sheet/captions-deployment-form'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { FarcasterDeploymentForm } from '@/features/agent/deployment-sheet/farcaster-deployment-form'
import { PrintifyDeploymentForm } from '@/features/agent/deployment-sheet/printify-deployment-form'
import { ShopifyDeploymentForm } from '@/features/agent/deployment-sheet/shopify-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { AlertCircle, Loader2 } from 'lucide-react'
import { FC, useState } from 'react'
import { toast } from 'sonner'

export const DeploymentSettingsInline: FC<{ agent: Agent }> = ({ agent }) => {
  const [ownerPays, setOwnerPays] = useState(agent.owner_pays || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        owner_pays: ownerPays,
      })
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
      <div className="bg-background border p-4 rounded-lg flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Cover Usage Costs</label>
          <p className="text-sm text-muted-foreground">
            When enabled, you (the agent owner) will cover all usage costs. When
            disabled, users will pay for their own usage.
          </p>
        </div>
        <Switch checked={ownerPays} onCheckedChange={setOwnerPays} />
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
          We were unable to fetch your deployments. Please
          try again later.
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
            <TwitterDeploymentForm
              agentId={agent._id}
              deployment={deployments?.find(
                deployment => deployment.platform === 'twitter',
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
          <h2 className="text-lg font-medium">
            Integration Settings
          </h2>
          <DeploymentSettingsInline agent={agent} />
        </div>
      </div>
    </div>
  )
}