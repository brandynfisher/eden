'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import AgentIntegrationsView from '@/features/sessions/views/agent-integrations-view'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
}

export interface IntegrationsTabHandle {
  save: () => Promise<void>
  hasUnsavedChanges: boolean
  isSaving: boolean
}

export const IntegrationsTab = forwardRef<
  IntegrationsTabHandle,
  IntegrationsTabProps
>(({ agent }, ref) => {
  useImperativeHandle(
    ref,
    () => ({
      save: async () => {},
      hasUnsavedChanges: false,
      isSaving: false,
    }),
    [],
  )

  return <AgentIntegrationsView agent={agent} variant="panel" />
})

IntegrationsTab.displayName = 'IntegrationsTab'
