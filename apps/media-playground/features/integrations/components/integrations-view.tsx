'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import UserAvatar from '@/components/user/user-avatar'
import { PlatformPicker } from '@/features/integrations/components/platform-picker'
import {
  INTEGRATION_FORMS,
  getIntegrationCategory,
  getIntegrationDescription,
  getIntegrationIcon,
  getIntegrationLabel,
} from '@/features/integrations/integration-definitions'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import {
  GatedResource,
  PREVIEW_ONLY_DEPLOYMENT_PLATFORMS,
  useGatedResource,
} from '@/hooks/use-gated-resource'
import { Deployment } from '@edenlabs/eden-sdk'
import {
  AlertCircle,
  ArrowLeft,
  BookTextIcon,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { FC, useCallback, useMemo, useState } from 'react'

type ViewState = 'list' | 'picker' | 'config'

interface IntegrationsViewProps {
  mode: 'global' | 'agent'
  agentId?: string
  isModalOpen?: boolean
}

export const IntegrationsView: FC<IntegrationsViewProps> = ({ agentId }) => {
  const [viewState, setViewState] = useState<ViewState>('list')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [editingDeployment, setEditingDeployment] = useState<
    Deployment | undefined
  >()

  const deploymentsGate = useGatedResource(GatedResource.Deployments, {
    lockedBehavior: 'modal',
  })
  const isPreviewUser = deploymentsGate.isPreviewUser

  const showIntegration = useCallback(
    (platform: Deployment['platform']) =>
      isPreviewUser || !PREVIEW_ONLY_DEPLOYMENT_PLATFORMS.has(platform),
    [isPreviewUser],
  )

  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agentId ?? '',
    enabled: Boolean(agentId) && deploymentsGate.isAllowed,
  })

  const agentQuery = useAgentQuery({
    key: agentId ?? '',
    enabled: Boolean(agentId),
    refetchOnWindowFocus: false,
  })

  const effectiveDeployments = deploymentsQuery.deployments
  const visibleDeployments = useMemo(
    () =>
      effectiveDeployments?.filter(deployment =>
        showIntegration(deployment.platform),
      ),
    [effectiveDeployments, showIntegration],
  )

  const connectedPlatforms = useMemo(() => {
    if (!visibleDeployments) return new Set<string>()
    return new Set(visibleDeployments.map(d => d.platform))
  }, [visibleDeployments])

  const integrations = visibleDeployments ?? []

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

  const handleNewIntegration = useCallback(() => {
    setSelectedPlatform('')
    setEditingDeployment(undefined)
    setViewState('picker')
  }, [])

  const handlePlatformSelect = useCallback((platform: string) => {
    setSelectedPlatform(platform)
    setEditingDeployment(undefined)
    setViewState('config')
  }, [])

  const handleEditDeployment = useCallback((deployment: Deployment) => {
    setSelectedPlatform(deployment.platform)
    setEditingDeployment(deployment)
    setViewState('config')
  }, [])

  const handleBackFromPicker = useCallback(() => {
    setViewState('list')
  }, [])

  const handleBackFromConfig = useCallback(() => {
    if (editingDeployment) {
      setViewState('list')
    } else {
      setViewState('picker')
    }
    setSelectedPlatform('')
    setEditingDeployment(undefined)
  }, [editingDeployment])

  const FormComponent = selectedPlatform
    ? INTEGRATION_FORMS[selectedPlatform]
    : undefined

  if (!deploymentsGate.isAllowed) {
    return (
      <LockedFeatureBanner
        gate={deploymentsGate}
        title="Integrations are a Pro feature"
        description="Connect your agents to Discord, Telegram, Farcaster, and more with a Pro plan."
      />
    )
  }

  if (deploymentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  if (deploymentsQuery.isError) {
    return (
      <div className="flex items-center justify-center gap-2 py-10">
        <AlertCircle className="size-4 text-destructive" />
        <p className="text-destructive">
          We were unable to fetch your deployments. Please try again later.
        </p>
      </div>
    )
  }

  // List View
  if (viewState === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={handleNewIntegration} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Integration
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

        {integrations.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
            <p>No integrations connected yet.</p>
            <p>Create a new integration to connect this agent to a platform.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDeployment(deployment)}
                          aria-label="Edit integration"
                          title="Edit integration"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  // Picker View
  if (viewState === 'picker') {
    return (
      <PlatformPicker
        onSelect={handlePlatformSelect}
        onBack={handleBackFromPicker}
        connectedPlatforms={connectedPlatforms}
        showBackButton={true}
      />
    )
  }

  // Config View
  if (viewState === 'config') {
    const isEditMode = Boolean(editingDeployment)

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackFromConfig}
          className="w-fit -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isEditMode ? 'Back to List' : 'Back to Platforms'}
        </Button>

        <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {agentQuery.agent?.userImage ? (
              <UserAvatar
                image={agentQuery.agent.userImage}
                name={agentQuery.agent.name}
                className="h-10 w-10"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted" />
            )}
            <div>
              <div className="text-xs uppercase text-muted-foreground">
                Agent
              </div>
              <div className="font-medium">
                {agentQuery.isLoading
                  ? 'Loading agent...'
                  : agentQuery.agent?.name ?? 'Unknown agent'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedPlatform && (
              <>
                {(() => {
                  const Icon = getIntegrationIcon(selectedPlatform)
                  return <Icon className="h-4 w-4" />
                })()}
                <span className="font-medium">
                  {getIntegrationLabel(selectedPlatform)}
                </span>
                <Badge variant="outline" className="capitalize">
                  {getIntegrationCategory(selectedPlatform)}
                </Badge>
              </>
            )}
            {editingDeployment && <Badge variant="secondary">Deployed</Badge>}
          </div>
        </div>

        {selectedPlatform && (
          <div className="text-sm text-muted-foreground">
            {getIntegrationDescription(selectedPlatform)}
          </div>
        )}

        {agentId && selectedPlatform && FormComponent ? (
          <FormComponent
            key={`${agentId}-${selectedPlatform}`}
            agentId={agentId}
            deployment={editingDeployment}
            variant="inline"
          />
        ) : (
          agentId &&
          selectedPlatform && (
            <div className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
              This integration is not yet supported.
            </div>
          )
        )}
      </div>
    )
  }

  return null
}

export default IntegrationsView
