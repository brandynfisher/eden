'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { useAppShell } from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import {
  AlertCircle,
  ArrowLeft,
  ChevronsUpDown,
  ExternalLink,
  MenuIcon,
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

const IntegrationWizardPage = () => {
  const [wizardStep, setWizardStep] = useState(0)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isWizardAgentModalOpen, setIsWizardAgentModalOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const deploymentsGate = useGatedResource(GatedResource.Deployments, {
    lockedBehavior: 'modal',
  })

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

  const { deployments, isPending, isError, error } = useUserDeploymentsQuery()

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

  const deployedPlatformsForSelectedAgent = useMemo(() => {
    if (!deployments || !selectedAgentId) return new Set<string>()
    return new Set(
      deployments
        .filter(deployment => deployment.agent?._id === selectedAgentId)
        .map(deployment => deployment.platform),
    )
  }, [deployments, selectedAgentId])

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

  const openWizard = useCallback(
    (agentId?: string, platform?: string) => {
      const nextAgentId = agentId ?? ''
      const nextPlatform = nextAgentId ? platform ?? '' : ''
      setSelectedAgentId(nextAgentId)
      setSelectedPlatform(nextPlatform)
      if (nextAgentId) {
        const agentFromDeployments =
          uniqueAgents.find(agent => agent._id === nextAgentId) ?? null
        if (agentFromDeployments) {
          setSelectedAgent(agentFromDeployments as Agent)
        }
      } else {
        setSelectedAgent(null)
      }
      if (nextAgentId && nextPlatform) {
        setWizardStep(2)
      } else if (nextAgentId) {
        setWizardStep(1)
      } else {
        setWizardStep(0)
      }
    },
    [uniqueAgents],
  )

  const updateWizardQuery = useCallback(
    (nextAgentId: string, nextPlatform: string) => {
      const params = new URLSearchParams(searchParams?.toString())

      if (nextAgentId) {
        params.set('agent', nextAgentId)
      } else {
        params.delete('agent')
      }

      if (nextPlatform) {
        params.set('platform', nextPlatform)
      } else {
        params.delete('platform')
      }

      const query = params.toString()
      const nextUrl = query
        ? `/integrations/wizard?${query}`
        : '/integrations/wizard'
      router.replace(nextUrl)
    },
    [router, searchParams],
  )

  useEffect(() => {
    const agentFromParams = searchParams?.get('agent') ?? undefined
    const platformFromParams = searchParams?.get('platform') ?? undefined
    if (!agentFromParams && !platformFromParams) return
    openWizard(agentFromParams, platformFromParams)
  }, [openWizard, searchParams])

  useEffect(() => {
    const agentParam = searchParams?.get('agent') ?? ''
    const platformParam = searchParams?.get('platform') ?? ''
    if (agentParam === selectedAgentId && platformParam === selectedPlatform) {
      return
    }
    updateWizardQuery(selectedAgentId, selectedPlatform)
  }, [searchParams, selectedAgentId, selectedPlatform, updateWizardQuery])

  useEffect(() => {
    if (selectedDeployment) {
      setWizardStep(2)
    }
  }, [selectedDeployment])

  const handleNextStep = () => {
    setWizardStep(prev => Math.min(prev + 1, 2))
  }

  const handlePreviousStep = () => {
    setWizardStep(prev => {
      if (prev === 2) {
        setSelectedPlatform('')
      }
      if (prev === 1) {
        setSelectedAgentId('')
        setSelectedAgent(null)
        setSelectedPlatform('')
      }
      return Math.max(prev - 1, 0)
    })
  }

  const resetWizard = () => {
    setWizardStep(0)
    setSelectedAgentId('')
    setSelectedAgent(null)
    setSelectedPlatform('')
    updateWizardQuery('', '')
  }

  const handleBackToIntegrations = () => {
    router.push('/integrations')
  }

  const headerTitle = isManageMode ? 'Manage Integration' : 'New Integration'
  const headerDescription = isManageMode
    ? 'Review settings and manage the deployment.'
    : 'Connect an agent to a platform in three quick steps.'

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
            <h2 className="text-2xl font-bold">{headerTitle}</h2>
            <p className="text-muted-foreground">{headerDescription}</p>
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
            <h2 className="text-2xl font-bold">{headerTitle}</h2>
            <p className="text-muted-foreground">{headerDescription}</p>
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
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToIntegrations}
              className="w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Integrations
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{headerTitle}</h2>
              <p className="text-muted-foreground">{headerDescription}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isManageMode && (
              <Button variant="outline" onClick={resetWizard}>
                Start over
              </Button>
            )}
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

        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
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

            <div className="flex flex-row items-center justify-between gap-3 sm:justify-between">
              {isManageMode ? (
                <Button onClick={handleBackToIntegrations}>Done</Button>
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
                    <Button onClick={handleBackToIntegrations}>Done</Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
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

export default IntegrationWizardPage
