'use client'

import {
  ConceptsTab,
  IntegrationsTab,
  type IntegrationsTabHandle,
  PermissionsTab,
  PersonaTab,
  ProfileTab,
  RealtimeTab,
  type RealtimeTabHandle,
  ToolsTab,
} from '../sessions/views/AgentEditView'
import { getPersonaCharacterLimit } from '../sessions/views/agent-constants'
import AgentDashboardView from '../sessions/views/agent-dashboard-view'
import AgentMemoryView from '../sessions/views/agent-memory-view'
import AgentTasksView from '../sessions/views/agent-tasks-view'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  AlertTriangle,
  BarChart3Icon,
  BrainIcon,
  ClockIcon,
  ImageIcon,
  KeyIcon,
  Loader2,
  MicIcon,
  ScrollTextIcon,
  SettingsIcon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface AgentSettingsModalProps {
  agentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: string
  memoriesOnly?: boolean // When true, only show the memories tab (for non-editors)
}

const getTabDescription = (tabKey: string, agentName: string) => {
  switch (tabKey) {
    case 'profile':
      return `Update ${agentName}'s identity and bio.`
    case 'persona':
      return `Define ${agentName}'s personality, behavior, and rules.`
    case 'dashboard':
      return `Explore ${agentName}'s stats across Eden.`
    case 'concepts':
      return `Manage the visual styles available to ${agentName}.`
    case 'tools':
      return `Choose the models, reasoning, and tools ${agentName} can use.`
    case 'integrations':
      return `Connect ${agentName} to social platforms and utilities.`
    case 'realtime':
      return `Configure ${agentName}'s voice conversation settings.`
    case 'memories':
      return `Review and edit ${agentName}'s memories.`
    case 'tasks':
      return `Schedule automated tasks for ${agentName}.`
    case 'manage':
      return `Manage permissions and settings for ${agentName}.`
    default:
      return undefined
  }
}

export const AgentSettingsModal: FC<AgentSettingsModalProps> = ({
  agentId,
  open,
  onOpenChange,
  initialTab = 'profile',
  memoriesOnly = false,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthState()
  const {
    agent,
    isLoading: isAgentLoading,
    invalidate,
  } = useAgentQuery({
    key: agentId,
    refetchOnWindowFocus: false,
  })

  // Track last user activity to implement delayed refetch
  const lastActivityTimeRef = useRef<number>(Date.now())

  // Track whether the form has been initialized to prevent resetting during edits
  const hasFormInitialized = useRef(false)

  // Refetch agent data only if user was inactive for 5+ minutes
  useEffect(() => {
    if (!open) return

    const REFETCH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current
        if (timeSinceLastActivity > REFETCH_THRESHOLD_MS) {
          invalidate() // Refetch after 5+ minutes of inactivity
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [open, invalidate])

  // When memoriesOnly mode, always use 'memories' tab
  const effectiveInitialTab = memoriesOnly ? 'memories' : initialTab
  const [activeTab, setActiveTab] = useState(effectiveInitialTab)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs for tabs with their own save logic
  const realtimeTabRef = useRef<RealtimeTabHandle>(null)
  const integrationsTabRef = useRef<IntegrationsTabHandle>(null)

  // Track unsaved changes from different tabs
  const [realtimeHasUnsavedChanges, setRealtimeHasUnsavedChanges] =
    useState(false)
  const [integrationsHasUnsavedChanges, setIntegrationsHasUnsavedChanges] =
    useState(false)

  // Track saving state for special tabs
  const [isSpecialTabSaving, setIsSpecialTabSaving] = useState(false)

  // Confirmation dialog for unsaved changes
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false)

  // Reset active tab and form initialization flag when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab(effectiveInitialTab)
    } else {
      // Reset initialization flag when modal closes so form will reinitialize on next open
      hasFormInitialized.current = false
    }
  }, [open, effectiveInitialTab])

  // Fetch deployments
  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agentId,
    enabled: !!agentId && open,
  })

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      key: '',
      image: '',
      description: '',
      persona: '',
      public: false,
      knowledge: '',
      greeting: '',
      voice: '',
      website: '',
      models: [],
      tools: {},
      llm_settings: {
        model_profile: 'medium',
        thinking_policy: 'auto',
        thinking_effort_cap: 'medium',
        thinking_effort_instructions: '',
      },
    },
  })

  // Reset activity timer whenever form changes (user is actively editing)
  useEffect(() => {
    const subscription = form.watch(() => {
      lastActivityTimeRef.current = Date.now()
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Update form when agent data changes - only on first load to prevent overwriting user edits
  useEffect(() => {
    if (agent && !hasFormInitialized.current) {
      hasFormInitialized.current = true
      form.reset({
        name: agent.name,
        key: agent.username,
        image:
          agent.userImage && agent.userImage.trim()
            ? getCloudfrontOriginalUrl(agent.userImage)
            : '',
        description: agent.description,
        persona: agent.persona,
        public: agent.public,
        knowledge: agent.knowledge ?? '',
        greeting: agent.greeting || '',
        voice: agent.voice || '',
        website: agent.website || '',
        models: agent.models || [],
        tools: agent.tools || {},
        llm_settings: {
          model_profile: agent.llm_settings?.model_profile || 'medium',
          thinking_policy: agent.llm_settings?.thinking_policy || 'auto',
          thinking_effort_cap:
            agent.llm_settings?.thinking_effort_cap || 'medium',
          thinking_effort_instructions:
            agent.llm_settings?.thinking_effort_instructions || '',
        },
      })
    }
  }, [agent, form])

  const handleSubmit = useCallback(
    async (data: AgentFormDto) => {
      if (!agent) return

      try {
        // Handle image field
        let imageToSend = data.image
        if (data.image && agent.userImage) {
          const originalImageUrl = getCloudfrontOriginalUrl(agent.userImage)
          if (data.image === originalImageUrl) {
            imageToSend = agent.userImage
          }
        }

        await axios.patch(`/api/agents/${agent._id}`, {
          ...data,
          image: imageToSend,
        })
        // Reset form with current values to clear dirty state
        form.reset(data)
        toast.success('Agent updated successfully', {
          description: `"${data.name}" has been updated successfully`,
          richColors: true,
          dismissible: true,
        })
      } catch (error) {
        const errorMessage =
          (error as AxiosError<{ message?: string }>).response?.data?.message ||
          (error as AxiosError).message ||
          'Please try again later.'
        const description =
          errorMessage === 'An agent with this key already exists'
            ? 'This username is taken. Please try another.'
            : errorMessage

        toast.error('Agent update failed', {
          description,
          richColors: true,
          dismissible: true,
        })
      }
    },
    [agent, form],
  )

  const handleDeleteAgent = async () => {
    if (!agent) return

    const confirmed = window.confirm(
      'Delete this agent? This action cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    try {
      await axios.delete(`/api/agents/${agent._id}`)
      await invalidate()

      toast.success('Agent deleted', {
        description: `"${agent.name}" has been deleted.`,
        richColors: true,
        dismissible: true,
      })

      onOpenChange(false)

      const segments = pathname?.split('/').filter(Boolean) ?? []
      if (segments[0] === 'chat' && segments[1] === agentId) {
        router.push('/agents')
      } else {
        router.refresh()
      }
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
        (error as AxiosError).message ||
        'Please try again later.'

      toast.error('Agent deletion failed', {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const {
    isOriginalOwner,
    hasOwnerAccess,
    hasEditAccess,
    isLoading: isPermissionsLoading,
  } = useAgentPermissions(agent || undefined, user?._id)

  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs: Array<{
      key: string
      label: string
      icon: typeof UserIcon
    }> = []

    // In memoriesOnly mode, only show the memories tab (for non-editors viewing memories)
    if (memoriesOnly) {
      tabs.push({ key: 'memories', label: 'Memories', icon: BrainIcon })
      return tabs
    }

    if (hasEditAccess) {
      tabs.push({ key: 'profile', label: 'Profile', icon: UserIcon })
      tabs.push({ key: 'persona', label: 'Persona', icon: ScrollTextIcon })
      tabs.push({ key: 'dashboard', label: 'Dashboard', icon: BarChart3Icon })
      tabs.push({ key: 'concepts', label: 'Concepts', icon: ImageIcon })
      tabs.push({ key: 'tools', label: 'Tools', icon: WrenchIcon })
      tabs.push({ key: 'memories', label: 'Memories', icon: BrainIcon })
      tabs.push({ key: 'tasks', label: 'Tasks', icon: ClockIcon })
    }

    if (hasOwnerAccess) {
      tabs.push({
        key: 'integrations',
        label: 'Integrations',
        icon: SettingsIcon,
      })
      if (user?.featureFlags?.includes(FeatureFlag.Preview)) {
        tabs.push({
          key: 'realtime',
          label: 'Realtime',
          icon: MicIcon,
        })
      }
    }

    // Manage tab - only visible to the original owner (not co-owners or co-editors)
    if (isOriginalOwner) {
      tabs.push({ key: 'manage', label: 'Manage', icon: KeyIcon })
    }

    return tabs
  }

  // Compute overall unsaved changes state (moved before early return for hooks)
  const formHasUnsavedChanges = form.formState.isDirty
  const hasUnsavedChanges =
    (activeTab === 'realtime' && realtimeHasUnsavedChanges) ||
    (activeTab === 'integrations' && integrationsHasUnsavedChanges) ||
    (['profile', 'persona', 'tools'].includes(activeTab) &&
      formHasUnsavedChanges)

  // Handler for saving based on current tab
  const handleSaveAction = useCallback(async () => {
    if (activeTab === 'realtime' && realtimeTabRef.current) {
      setIsSpecialTabSaving(true)
      try {
        await realtimeTabRef.current.save()
      } finally {
        setIsSpecialTabSaving(false)
      }
    } else if (activeTab === 'integrations' && integrationsTabRef.current) {
      setIsSpecialTabSaving(true)
      try {
        await integrationsTabRef.current.save()
      } finally {
        setIsSpecialTabSaving(false)
      }
    } else {
      await form.handleSubmit(
        data => {
          return handleSubmit(data)
        },
        errors => {
          // Build a user-friendly error message from validation errors
          const errorMessages = Object.entries(errors)
            .map(([field, error]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1)
              return `${fieldName}: ${error?.message || 'Invalid value'}`
            })
            .join('\n')

          toast.error('Validation failed', {
            description: errorMessages,
            richColors: true,
            dismissible: true,
          })
        },
      )()
    }
  }, [activeTab, form, handleSubmit])

  // Handler for closing with unsaved changes check
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && hasUnsavedChanges) {
        setShowUnsavedChangesDialog(true)
        return
      }
      onOpenChange(newOpen)
    },
    [hasUnsavedChanges, onOpenChange],
  )

  // Handler for confirming close with unsaved changes
  const handleConfirmClose = useCallback(() => {
    setShowUnsavedChangesDialog(false)
    onOpenChange(false)
  }, [onOpenChange])

  const availableTabs = getAvailableTabs()
  const currentTab = availableTabs.find(tab => tab.key === activeTab)
  const headerDescription =
    agent && currentTab ? getTabDescription(activeTab, agent.name) : undefined

  if (isAgentLoading || isPermissionsLoading || !agent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Determine if save button should show for current tab
  // Note: 'integrations' is excluded because each integration has its own Deploy/Update buttons
  const showSaveButton =
    activeTab !== 'tasks' &&
    activeTab !== 'memories' &&
    activeTab !== 'concepts' &&
    activeTab !== 'manage' &&
    activeTab !== 'dashboard' &&
    activeTab !== 'integrations'

  // Determine if save is in progress
  const isSaving =
    form.formState.isSubmitting ||
    isSpecialTabSaving ||
    (activeTab === 'realtime' && realtimeTabRef.current?.isSaving) ||
    (activeTab === 'integrations' && integrationsTabRef.current?.isSaving)

  // Check persona character limit
  const personaCharacterLimit = getPersonaCharacterLimit(
    user?.subscriptionTier ?? SubscriptionTier.Free,
  )
  const currentPersonaLength = form.watch('persona')?.length || 0
  const isPersonaOverLimit = currentPersonaLength > personaCharacterLimit

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Agent Settings</DialogTitle>
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:flex w-56 border-r bg-muted/30 flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/40">
                    <AvatarImage
                      src={
                        agent.userImage && agent.userImage.trim()
                          ? getCloudfrontOriginalUrl(agent.userImage)
                          : undefined
                      }
                      alt={agent.name}
                    />
                    <AvatarFallback className="text-sm">
                      {agent.name?.charAt(0).toUpperCase() ?? 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-lg leading-tight">
                      Settings
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {agent.name}
                    </p>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {availableTabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
                          activeTab === tab.key
                            ? 'bg-background text-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Mobile Header with Dropdown Tabs */}
            <div className="md:hidden border-b bg-background">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border/40">
                    <AvatarImage
                      src={
                        agent.userImage && agent.userImage.trim()
                          ? getCloudfrontOriginalUrl(agent.userImage)
                          : undefined
                      }
                      alt={agent.name}
                    />
                    <AvatarFallback className="text-sm">
                      {agent.name?.charAt(0).toUpperCase() ?? 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-base leading-tight">
                      Settings
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {agent.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full px-4 py-3">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger
                    className="w-full"
                    aria-label="Select settings tab"
                  >
                    <SelectValue placeholder="Select tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTabs.map(tab => {
                      const Icon = tab.icon
                      return (
                        <SelectItem key={tab.key} value={tab.key}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {currentTab && (
                    <div className="mb-8 space-y-2">
                      <h1 className="text-3xl font-semibold">
                        {currentTab.label}
                      </h1>
                      {headerDescription && (
                        <p className="text-sm text-muted-foreground max-w-2xl">
                          {headerDescription}
                        </p>
                      )}
                    </div>
                  )}
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-8"
                    >
                      {activeTab === 'profile' && (
                        <ProfileTab form={form} agent={agent} />
                      )}

                      {activeTab === 'persona' && hasEditAccess && (
                        <PersonaTab form={form} />
                      )}

                      {activeTab === 'tools' && hasEditAccess && (
                        <ToolsTab
                          form={form}
                          hasDeployments={
                            deploymentsQuery.deployments &&
                            deploymentsQuery.deployments.length > 0
                          }
                          user={user}
                        />
                      )}

                      {activeTab === 'concepts' && hasEditAccess && (
                        <ConceptsTab form={form} agent={agent} />
                      )}

                      {activeTab === 'integrations' && hasOwnerAccess && (
                        <IntegrationsTab
                          ref={integrationsTabRef}
                          agent={agent}
                          deployments={deploymentsQuery.deployments}
                          isLoading={deploymentsQuery.isPending}
                          isError={deploymentsQuery.isError}
                          onUnsavedChangesChange={
                            setIntegrationsHasUnsavedChanges
                          }
                        />
                      )}

                      {activeTab === 'realtime' &&
                        hasOwnerAccess &&
                        user?.featureFlags?.includes(FeatureFlag.Preview) && (
                          <RealtimeTab
                            ref={realtimeTabRef}
                            agent={agent}
                            onUnsavedChangesChange={
                              setRealtimeHasUnsavedChanges
                            }
                          />
                        )}

                      {activeTab === 'memories' &&
                        (hasEditAccess || memoriesOnly) && (
                          <AgentMemoryView agent={agent} variant="panel" />
                        )}

                      {activeTab === 'tasks' && hasEditAccess && (
                        <AgentTasksView agent={agent} variant="panel" />
                      )}

                      {activeTab === 'dashboard' && hasEditAccess && (
                        <AgentDashboardView agent={agent} variant="panel" />
                      )}

                      {activeTab === 'manage' && isOriginalOwner && (
                        <div className="space-y-8">
                          {/* Permissions Section - only for original owner */}
                          {isOriginalOwner && <PermissionsTab agent={agent} />}

                          {/* Danger Zone */}
                          <div className="space-y-4">
                            <h2 className="text-lg font-medium text-destructive">
                              Danger Zone
                            </h2>
                            <div className="rounded-xl border border-destructive/60 bg-card p-6">
                              <p className="text-base font-semibold text-destructive">
                                Permanently delete this agent
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                This will remove the agent, its deployments, and
                                any associated data. This action cannot be
                                undone.
                              </p>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteAgent}
                                disabled={isDeleting}
                                className="mt-4 w-full md:w-auto"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting Agent...
                                  </>
                                ) : (
                                  <>
                                    <Trash2Icon className="w-4 h-4 mr-2" />
                                    Delete Agent Permanently
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>
              </ScrollArea>

              {/* Action Footer */}
              {showSaveButton && (
                <div className="border-t p-4 bg-background flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  {/* Unsaved changes warning */}
                  <div className="flex items-center gap-2">
                    {isPersonaOverLimit ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-sm text-red-500">
                          Persona exceeds character limit
                        </span>
                      </>
                    ) : (
                      hasUnsavedChanges && (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm text-amber-500">
                            You have unsaved changes
                          </span>
                        </>
                      )
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveAction}
                    disabled={isSaving || isDeleting || isPersonaOverLimit}
                    className={cn(
                      'w-full md:w-auto',
                      isPersonaOverLimit && 'opacity-50 cursor-not-allowed',
                    )}
                    title={
                      isPersonaOverLimit
                        ? 'Persona exceeds character limit'
                        : undefined
                    }
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes to your agent&apos;s settings. Are you
              sure you want to close without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedChangesDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
