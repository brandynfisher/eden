'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  getIntegrationCategory,
  getIntegrationIcon,
  getIntegrationLabel,
} from '@/features/integrations/integration-definitions'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import {
  GatedResource,
  PREVIEW_ONLY_DEPLOYMENT_PLATFORMS,
  useGatedResource,
} from '@/hooks/use-gated-resource'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  AlertCircle,
  BookTextIcon,
  ExternalLink,
  Loader2,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
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
>(({ agent, deployments, isLoading, isError }, ref) => {
  // Expose imperative handle for parent (no longer has settings to save)
  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        // No settings to save - payer settings moved to Manage tab
      },
      get hasUnsavedChanges() {
        return false
      },
      get isSaving() {
        return false
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

  const getDeploymentStatus = (deployment: Deployment) => {
    return deployment.valid === true
      ? 'active'
      : deployment.valid === false
      ? 'inactive'
      : 'unknown'
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const integrations = visibleDeployments ?? []

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Manage integrations for this agent in the Integrations hub.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/integrations?wizard=1&agent=${agent._id}`}>
              New Integration
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/integrations?agent=${agent._id}`}>
              Open Integrations
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/70 text-purple-300"
          >
            <Link
              href="https://docs.eden.art/integrations"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2"
            >
              <BookTextIcon className="size-4" />
              Integration Guide
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-medium">
            Connected Integrations
          </CardTitle>
          <Badge variant="outline">{integrations.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {integrations.length === 0 ? (
            <div className="flex flex-col gap-2 p-6 text-sm text-muted-foreground">
              <p>No integrations connected yet.</p>
              <p>
                Create a new integration to connect this agent to a platform.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map(deployment => {
                    const Icon = getIntegrationIcon(deployment.platform)
                    return (
                      <TableRow key={deployment._id}>
                        <TableCell className="py-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted/40">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium">
                                {getIntegrationLabel(deployment.platform)}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {getIntegrationCategory(deployment.platform)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(
                              getDeploymentStatus(deployment),
                            )}
                            className="capitalize"
                          >
                            {getDeploymentStatus(deployment)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/integrations?wizard=1&agent=${agent._id}&platform=${deployment.platform}`}
                              aria-label="Edit integration"
                              title="Edit integration"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

IntegrationsTab.displayName = 'IntegrationsTab'
