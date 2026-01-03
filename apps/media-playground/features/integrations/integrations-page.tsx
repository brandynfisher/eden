'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { useAppShell } from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import UserAvatar from '@/components/user/user-avatar'
import { CaptionsDeploymentForm } from '@/features/agent/deployment-sheet/captions-deployment-form'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { DiscordV3DeploymentForm } from '@/features/agent/deployment-sheet/discord-v3-deployment-form'
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
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_DEFINITIONS,
  IntegrationCategory,
  getIntegrationCategory,
  getIntegrationDescription,
  getIntegrationIcon,
  getIntegrationLabel,
} from '@/features/integrations/integration-definitions'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useUserDeploymentsQuery } from '@/hooks/query/use-user-deployments-query'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { cn } from '@/lib/utils'
import { updateDeleteDialog } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  Activity,
  AlertCircle,
  ChevronsUpDown,
  ExternalLink,
  Filter,
  Loader2,
  MenuIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { toast } from 'sonner'

type DeploymentWithAgent = Deployment & {
  agent?: {
    _id: string
    name: string
    username: string
    userImage?: string
  }
}

type IntegrationFormProps = {
  agentId: string
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

const INTEGRATION_FORMS: Record<string, ComponentType<IntegrationFormProps>> = {
  discord: DiscordDeploymentForm,
  discord_v3: DiscordV3DeploymentForm,
  telegram: TelegramDeploymentForm,
  twitter: TwitterDeploymentForm,
  farcaster: FarcasterDeploymentForm,
  instagram: InstagramDeploymentForm,
  tiktok: TiktokDeploymentForm,
  google_calendar: GoogleCalendarDeploymentForm,
  shopify: ShopifyDeploymentForm,
  printify: PrintifyDeploymentForm,
  captions: CaptionsDeploymentForm,
  email: EmailDeploymentForm,
  gmail: GmailDeploymentForm,
}

const IntegrationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [agentFilter, setAgentFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<Agent | null>(
    null,
  )
  const [isAgentFilterModalOpen, setIsAgentFilterModalOpen] = useState(false)
  const [isWizardAgentModalOpen, setIsWizardAgentModalOpen] = useState(false)
  const [deletingDeploymentId, setDeletingDeploymentId] = useState<
    string | null
  >(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const dispatch = useAppDispatch()
  const deploymentsGate = useGatedResource(GatedResource.Deployments, {
    lockedBehavior: 'modal',
  })
  const basePath = '/integrations'

  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
            }}
            className="flex items-center gap-2"
          >
            <span className="text-lg font-semibold">Integrations</span>
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, setConfig])

  const { deployments, isPending, isError, error, invalidate } =
    useUserDeploymentsQuery()

  const uniqueAgents = useMemo(() => {
    if (!deployments) return []
    const agentsList = deployments
      .map(deployment => deployment.agent)
      .filter(Boolean) as NonNullable<DeploymentWithAgent['agent']>[]
    const unique = agentsList.filter(
      (agent, index, self) =>
        index === self.findIndex(a => a._id === agent._id),
    )
    return unique
  }, [deployments])

  const selectedAgentFromDeployments = useMemo(() => {
    if (!selectedAgentId) return null
    return uniqueAgents.find(agent => agent._id === selectedAgentId) ?? null
  }, [selectedAgentId, uniqueAgents])

  const effectiveSelectedAgent = selectedAgent ?? selectedAgentFromDeployments

  const selectedFilterAgent = useMemo(() => {
    if (selectedAgentFilter) return selectedAgentFilter
    if (!agentFilter) return null
    return uniqueAgents.find(agent => agent._id === agentFilter) ?? null
  }, [agentFilter, selectedAgentFilter, uniqueAgents])

  const agentsWithDeployments = useMemo(() => {
    if (!deployments) return []
    const unique = new Set<string>()
    deployments.forEach(deployment => {
      if (deployment.agent?._id) {
        unique.add(deployment.agent._id)
      }
    })
    return Array.from(unique)
  }, [deployments])

  const uniquePlatforms = useMemo(() => {
    if (!deployments) return []
    return [...new Set(deployments.map(d => d.platform))]
  }, [deployments])

  const filteredDeployments = useMemo(() => {
    if (!deployments) return []
    return deployments.filter(deployment => {
      const agentName = deployment.agent?.name?.toLowerCase() ?? ''
      const platformName = getIntegrationLabel(
        deployment.platform,
      ).toLowerCase()
      const matchesSearch =
        agentName.includes(searchTerm.toLowerCase()) ||
        platformName.includes(searchTerm.toLowerCase())

      const deploymentStatus =
        deployment.valid === true
          ? 'active'
          : deployment.valid === false
          ? 'inactive'
          : 'unknown'
      const matchesStatus =
        !statusFilter ||
        statusFilter === 'all' ||
        deploymentStatus === statusFilter
      const matchesPlatform =
        !platformFilter ||
        platformFilter === 'all' ||
        deployment.platform === platformFilter
      const matchesAgent =
        !agentFilter ||
        agentFilter === 'all' ||
        deployment.agent?._id === agentFilter
      const matchesCategory =
        !categoryFilter ||
        categoryFilter === 'all' ||
        getIntegrationCategory(deployment.platform) === categoryFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlatform &&
        matchesAgent &&
        matchesCategory
      )
    })
  }, [
    deployments,
    searchTerm,
    statusFilter,
    platformFilter,
    agentFilter,
    categoryFilter,
  ])

  const pageSize = 10
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDeployments.length / pageSize),
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, platformFilter, agentFilter, categoryFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedDeployments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredDeployments.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredDeployments])

  const deployedPlatformsForSelectedAgent = useMemo(() => {
    if (!deployments || !selectedAgentId) return new Set<string>()
    return new Set(
      deployments
        .filter(deployment => deployment.agent?._id === selectedAgentId)
        .map(deployment => deployment.platform),
    )
  }, [deployments, selectedAgentId])

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
        return 'default'
      case 'stopped':
      case 'inactive':
        return 'secondary'
      case 'error':
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getDeploymentStatus = (deployment: { valid?: boolean }) => {
    return deployment.valid === true
      ? 'active'
      : deployment.valid === false
      ? 'inactive'
      : 'unknown'
  }

  const availablePlatforms = useMemo(
    () => INTEGRATION_DEFINITIONS.filter(def => def.allowCreate !== false),
    [],
  )

  const platformsByCategory = useMemo(() => {
    return availablePlatforms.reduce(
      (acc, platform) => {
        acc[platform.category].push(platform)
        return acc
      },
      {
        social: [],
        utilities: [],
        other: [],
      } as Record<string, typeof availablePlatforms>,
    )
  }, [availablePlatforms])

  const selectedDeployment = useMemo(() => {
    if (!selectedAgentId || !selectedPlatform) return undefined
    return (deployments as DeploymentWithAgent[])?.find(
      deployment =>
        deployment.agent?._id === selectedAgentId &&
        deployment.platform === selectedPlatform,
    )
  }, [deployments, selectedAgentId, selectedPlatform])

  const isManageMode = Boolean(selectedDeployment)

  const FormComponent = selectedPlatform
    ? INTEGRATION_FORMS[selectedPlatform]
    : undefined

  const handleDeleteDeployment = useCallback(
    (deployment: DeploymentWithAgent) => {
      const platformLabel = getIntegrationLabel(deployment.platform)
      const agentName = deployment.agent?.name ?? 'this agent'
      dispatch(
        updateDeleteDialog({
          isOpen: true,
          title: `Delete ${platformLabel} integration?`,
          description: `This will remove the ${platformLabel} deployment for ${agentName}.`,
          onDelete: async () => {
            try {
              setDeletingDeploymentId(deployment._id ?? null)
              if (!deployment.agent?._id) {
                toast.error('Unable to delete deployment', {
                  description: 'Missing agent information.',
                  richColors: true,
                  dismissible: true,
                })
                return
              }
              await axios.delete(
                `/api/agents/${deployment.agent._id}/deployments`,
                {
                  data: { platform: deployment.platform },
                },
              )
              toast.success('Deployment deleted', {
                description: `${platformLabel} has been removed.`,
                richColors: true,
                dismissible: true,
              })
            } catch (error) {
              const apiErrorMessage =
                error instanceof Error ? error.message : String(error)
              toast.error('Failed to delete deployment', {
                description: apiErrorMessage || 'Please try again later.',
                richColors: true,
                dismissible: true,
              })
            } finally {
              setDeletingDeploymentId(null)
              await invalidate()
            }
          },
        }),
      )
    },
    [dispatch, invalidate],
  )

  const openWizard = useCallback(
    (agentId?: string, platform?: string) => {
      const nextAgentId = agentId ?? ''
      setSelectedAgentId(nextAgentId)
      setSelectedPlatform(platform ?? '')
      if (nextAgentId) {
        const agentFromDeployments =
          uniqueAgents.find(agent => agent._id === nextAgentId) ?? null
        if (agentFromDeployments) {
          setSelectedAgent(agentFromDeployments as Agent)
        }
      } else {
        setSelectedAgent(null)
      }
      if (nextAgentId && platform) {
        setWizardStep(2)
      } else if (nextAgentId) {
        setWizardStep(1)
      } else {
        setWizardStep(0)
      }
      setWizardOpen(true)
    },
    [uniqueAgents],
  )

  const resetWizard = () => {
    setWizardStep(0)
    setSelectedAgentId('')
    setSelectedPlatform('')
    setSelectedAgent(null)
  }

  useEffect(() => {
    const shouldOpenWizard =
      searchParams?.get('wizard') === '1' ||
      searchParams?.get('wizard') === 'true'
    if (!shouldOpenWizard) return

    const agentFromParams = searchParams?.get('agent') ?? undefined
    const platformFromParams = searchParams?.get('platform') ?? undefined
    openWizard(agentFromParams, platformFromParams)
  }, [searchParams, openWizard])

  useEffect(() => {
    const shouldOpenWizard =
      searchParams?.get('wizard') === '1' ||
      searchParams?.get('wizard') === 'true'
    if (shouldOpenWizard) return

    const agentFromParams = searchParams?.get('agent')
    const platformFromParams = searchParams?.get('platform')
    if (agentFromParams) {
      setAgentFilter(agentFromParams)
    }
    if (platformFromParams) {
      setPlatformFilter(platformFromParams)
    }
  }, [searchParams])

  useEffect(() => {
    if (!agentFilter) {
      setSelectedAgentFilter(null)
      return
    }
    if (selectedAgentFilter?._id === agentFilter) return
    const agentFromDeployments =
      uniqueAgents.find(agent => agent._id === agentFilter) ?? null
    if (agentFromDeployments) {
      setSelectedAgentFilter(agentFromDeployments as Agent)
    }
  }, [agentFilter, selectedAgentFilter, uniqueAgents])

  useEffect(() => {
    if (selectedDeployment) {
      setWizardStep(2)
    }
  }, [selectedDeployment])

  const handleWizardOpenChange = (open: boolean) => {
    setWizardOpen(open)
    if (!open) {
      resetWizard()
      if (searchParams?.get('wizard')) {
        router.replace(basePath)
      }
    }
  }

  const handleNextStep = () => {
    setWizardStep(prev => Math.min(prev + 1, 2))
  }

  const handlePreviousStep = () => {
    setWizardStep(prev => Math.max(prev - 1, 0))
  }

  const renderContent = () => {
    if (!deploymentsGate.isAllowed) {
      return (
        <LockedFeatureBanner
          gate={deploymentsGate}
          title="Integrations are a Pro feature"
          description="Upgrade to connect your agents to Discord, Telegram, Farcaster, and more."
        />
      )
    }

    if (isPending) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Integrations</h2>
            <p className="text-muted-foreground">
              Manage all your agent integrations across platforms and services
            </p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (isError) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Integrations</h2>
            <p className="text-muted-foreground">
              Manage all your agent integrations across platforms and services
            </p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>Failed to load integrations: {error?.message}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Integrations</h2>
            <p className="text-muted-foreground">
              Manage all your agent integrations across platforms and services
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => openWizard()} className="gap-2">
              <Plus className="h-4 w-4" />
              New Integration
            </Button>
            <Button variant="outline" asChild>
              <Link
                href="https://docs.eden.art/integrations"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                Integration Guide
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Dialog open={wizardOpen} onOpenChange={handleWizardOpenChange}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>
                {isManageMode ? 'Manage Integration' : 'New Integration'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {isManageMode
                  ? 'Review settings and manage the deployment.'
                  : 'Connect an agent to a platform in three quick steps.'}
              </DialogDescription>
            </DialogHeader>

            {!isManageMode && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                {[
                  {
                    title: 'Select Agent',
                    description: 'Choose which agent to connect.',
                  },
                  {
                    title: 'Choose Platform',
                    description: 'Pick the destination integration.',
                  },
                  {
                    title: 'Configure',
                    description: 'Set up credentials and options.',
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className={cn(
                      'rounded-lg border p-2 text-xs sm:p-3 sm:text-sm',
                      wizardStep === index
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 text-muted-foreground',
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-wide">
                      Step {index + 1}
                    </div>
                    <div className="font-medium text-foreground">
                      {step.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground sm:text-xs">
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isManageMode && wizardStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select an agent</Label>
                  <button
                    type="button"
                    onClick={() => setIsWizardAgentModalOpen(true)}
                    className={cn(
                      'group w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                      effectiveSelectedAgent
                        ? 'bg-muted/30 hover:bg-muted/50 hover:border-border'
                        : 'border-dashed text-muted-foreground hover:text-foreground hover:border-border',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {effectiveSelectedAgent ? (
                        <>
                          <UserAvatar
                            image={effectiveSelectedAgent.userImage}
                            name={effectiveSelectedAgent.name}
                            className="h-8 w-8"
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {effectiveSelectedAgent.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{effectiveSelectedAgent.username}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span>Select an agent</span>
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </button>
                </div>
              </div>
            )}

            {!isManageMode && wizardStep === 1 && (
              <div className="space-y-6">
                {Object.entries(platformsByCategory).map(
                  ([category, platforms]) =>
                    platforms.length > 0 && (
                      <div key={category} className="space-y-3">
                        <div className="text-xs font-semibold uppercase text-muted-foreground">
                          {
                            INTEGRATION_CATEGORIES[
                              category as IntegrationCategory
                            ]
                          }
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {platforms.map(platform => {
                            const Icon = platform.icon
                            const isAlreadyDeployed =
                              deployedPlatformsForSelectedAgent.has(
                                platform.platform,
                              )
                            const isSelected =
                              selectedPlatform === platform.platform

                            return (
                              <button
                                key={platform.platform}
                                type="button"
                                disabled={isAlreadyDeployed}
                                onClick={() => {
                                  if (isAlreadyDeployed) return
                                  setSelectedPlatform(platform.platform)
                                  setWizardStep(2)
                                }}
                                className={cn(
                                  'flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors sm:p-4',
                                  isAlreadyDeployed
                                    ? 'cursor-not-allowed border-border/40 bg-muted/20 text-muted-foreground'
                                    : isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border/60 hover:border-border',
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span className="font-medium">
                                    {platform.label}
                                  </span>
                                  {isAlreadyDeployed && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] uppercase tracking-wide"
                                    >
                                      Connected
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {platform.description}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ),
                )}
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    {effectiveSelectedAgent?.userImage ? (
                      <UserAvatar
                        image={effectiveSelectedAgent.userImage}
                        name={effectiveSelectedAgent.name}
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
                        {effectiveSelectedAgent?.name ?? 'Unknown agent'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPlatform ? (
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
                    ) : (
                      <span className="text-muted-foreground">
                        Select a platform
                      </span>
                    )}
                    {selectedDeployment && (
                      <Badge variant="secondary">Deployed</Badge>
                    )}
                  </div>
                </div>

                {selectedPlatform && (
                  <div className="text-sm text-muted-foreground">
                    {getIntegrationDescription(selectedPlatform)}
                  </div>
                )}

                {!isManageMode && !selectedAgentId && (
                  <div className="text-sm text-destructive">
                    Select an agent to continue.
                  </div>
                )}

                {!isManageMode && !selectedPlatform && (
                  <div className="text-sm text-destructive">
                    Select a platform to continue.
                  </div>
                )}

                {selectedAgentId && selectedPlatform && FormComponent ? (
                  <FormComponent
                    key={`${selectedAgentId}-${selectedPlatform}`}
                    agentId={selectedAgentId}
                    deployment={selectedDeployment}
                    variant="inline"
                  />
                ) : (
                  selectedAgentId &&
                  selectedPlatform && (
                    <div className="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                      This integration is not yet supported in the wizard.
                    </div>
                  )
                )}
              </div>
            )}

            <DialogFooter className="flex flex-row items-center justify-between gap-3 sm:justify-between">
              {isManageMode ? (
                <Button onClick={() => handleWizardOpenChange(false)}>
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={wizardStep === 0}
                  >
                    Back
                  </Button>
                  {wizardStep < 2 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={
                        (wizardStep === 0 && !selectedAgentId) ||
                        (wizardStep === 1 && !selectedPlatform)
                      }
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button onClick={() => handleWizardOpenChange(false)}>
                      Done
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setFiltersOpen(prev => !prev)}
            >
              {filtersOpen ? 'Hide' : 'Show'}
            </Button>
          </CardHeader>
          <CardContent
            className={cn(
              'pt-0 md:pt-6',
              filtersOpen ? 'block' : 'hidden md:block',
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="search" className="text-xs">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {Object.entries(INTEGRATION_CATEGORIES).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Platform</Label>
                <Select
                  value={platformFilter}
                  onValueChange={setPlatformFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All platforms</SelectItem>
                    {uniquePlatforms.map(platform => {
                      const Icon = getIntegrationIcon(platform)
                      return (
                        <SelectItem key={platform} value={platform}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{getIntegrationLabel(platform)}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Agent</Label>
                <button
                  type="button"
                  onClick={() => setIsAgentFilterModalOpen(true)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    selectedFilterAgent
                      ? 'bg-muted/30 hover:bg-muted/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {selectedFilterAgent ? (
                    <>
                      <UserAvatar
                        image={selectedFilterAgent.userImage}
                        name={selectedFilterAgent.name}
                        className="h-6 w-6"
                      />
                      <span className="flex-1 truncate">
                        {selectedFilterAgent.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Change
                      </span>
                    </>
                  ) : (
                    <span>All agents</span>
                  )}
                </button>
                {selectedFilterAgent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setAgentFilter('')
                      setSelectedAgentFilter(null)
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              All Integrations ({filteredDeployments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredDeployments.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                No integrations found.
              </div>
            ) : (
              <>
                <div className="md:hidden p-4 space-y-3">
                  {paginatedDeployments.map(deployment => {
                    const Icon = getIntegrationIcon(deployment.platform)
                    const isDeleting = deletingDeploymentId === deployment._id
                    return (
                      <div
                        key={deployment._id}
                        className="rounded-xl border border-border/50 bg-background/60 p-4 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {getIntegrationLabel(deployment.platform)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {
                                  INTEGRATION_CATEGORIES[
                                    getIntegrationCategory(deployment.platform)
                                  ]
                                }
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={getStatusVariant(
                              getDeploymentStatus(deployment),
                            )}
                            className="capitalize"
                          >
                            {getDeploymentStatus(deployment)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <UserAvatar
                            image={deployment.agent?.userImage}
                            name={deployment.agent?.name}
                            className="h-6 w-6"
                          />
                          <span className="truncate">
                            {deployment.agent?.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              router.push(
                                `${basePath}?wizard=1&agent=${deployment.agent?._id}&platform=${deployment.platform}`,
                              )
                            }
                            aria-label="Edit integration"
                            title="Edit integration"
                            disabled={isDeleting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteDeployment(deployment)}
                            aria-label="Delete integration"
                            title="Delete integration"
                            disabled={isDeleting}
                            className="text-destructive hover:text-destructive"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Agent</TableHead>
                        <TableHead className="min-w-[220px]">
                          Platform
                        </TableHead>
                        <TableHead className="min-w-[120px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDeployments.map(deployment => {
                        const Icon = getIntegrationIcon(deployment.platform)
                        const isDeleting =
                          deletingDeploymentId === deployment._id
                        return (
                          <TableRow key={deployment._id}>
                            <TableCell className="p-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar
                                  image={deployment.agent?.userImage}
                                  name={deployment.agent?.name}
                                  className="h-6 w-6 flex-shrink-0"
                                />
                                <Link
                                  href={`/agents/${deployment.agent?.username}`}
                                  className="text-sm hover:underline truncate"
                                >
                                  {deployment.agent?.name}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell className="p-4 align-top">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted/40">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <span className="font-medium">
                                    {getIntegrationLabel(deployment.platform)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {
                                      INTEGRATION_CATEGORIES[
                                        getIntegrationCategory(
                                          deployment.platform,
                                        )
                                      ]
                                    }
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-4">
                              <Badge
                                variant={getStatusVariant(
                                  getDeploymentStatus(deployment),
                                )}
                                className="capitalize whitespace-nowrap"
                              >
                                {getDeploymentStatus(deployment)}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    router.push(
                                      `${basePath}?wizard=1&agent=${deployment.agent?._id}&platform=${deployment.platform}`,
                                    )
                                  }
                                  title="Edit integration"
                                  aria-label="Edit integration"
                                  disabled={isDeleting}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteDeployment(deployment)
                                  }
                                  className="text-destructive hover:text-destructive"
                                  title="Delete integration"
                                  aria-label="Delete integration"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">Integrations</h1>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex-1 min-h-0">
          {renderContent()}
        </div>
      </div>

      <SingleAgentSelectorModal
        open={isAgentFilterModalOpen}
        onOpenChange={setIsAgentFilterModalOpen}
        allowedAgentIds={agentsWithDeployments}
        emptyStateText="No agents with integrations yet."
        onSelect={agent => {
          setSelectedAgentFilter(agent)
          setAgentFilter(agent._id)
          setIsAgentFilterModalOpen(false)
        }}
      />

      <SingleAgentSelectorModal
        open={isWizardAgentModalOpen}
        onOpenChange={setIsWizardAgentModalOpen}
        onSelect={agent => {
          setSelectedAgent(agent)
          setSelectedAgentId(agent._id)
          setSelectedPlatform('')
          setWizardStep(1)
          setIsWizardAgentModalOpen(false)
        }}
      />
    </>
  )
}

export default IntegrationsPage
