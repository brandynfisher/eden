'use client'

import {
  ConceptsTab,
  IntegrationsTab,
  PermissionsTab,
  ProfileTab,
  ToolsTab,
} from '../sessions/views/AgentEditView'
import AgentDashboardView from '../sessions/views/agent-dashboard-view'
import AgentMemoryView from '../sessions/views/agent-memory-view'
import AgentTasksView from '../sessions/views/agent-tasks-view'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  BarChart3Icon,
  BrainIcon,
  ClockIcon,
  ImageIcon,
  KeyIcon,
  Loader2,
  SettingsIcon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface AgentSettingsModalProps {
  agentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: string
}

const getTabDescription = (tabKey: string, agentName: string) => {
  switch (tabKey) {
    case 'profile':
      return `Update ${agentName}'s identity, bio, and instructions.`
    case 'dashboard':
      return `Explore ${agentName}'s stats across Eden.`
    case 'concepts':
      return `Manage the visual styles available to ${agentName}.`
    case 'tools':
      return `Choose the models, reasoning, and tools ${agentName} can use.`
    case 'integrations':
      return `Connect ${agentName} to social platforms and utilities.`
    case 'memories':
      return `Review and edit ${agentName}'s memories.`
    case 'tasks':
      return `Schedule automated tasks for ${agentName}.`
    case 'permissions':
      return `Control who can view, edit, or manage ${agentName}.`
    case 'manage':
      return `Manage ${agentName}'s data.`
    default:
      return undefined
  }
}

export const AgentSettingsModal: FC<AgentSettingsModalProps> = ({
  agentId,
  open,
  onOpenChange,
  initialTab = 'profile',
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
  })

  const [activeTab, setActiveTab] = useState(initialTab)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset active tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

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

  // Update form when agent data changes
  useEffect(() => {
    if (agent) {
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

  const handleSubmit = async (data: AgentFormDto) => {
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
  }

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

    if (hasEditAccess) {
      tabs.push({ key: 'profile', label: 'Profile', icon: UserIcon })
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
      tabs.push({ key: 'manage', label: 'Manage', icon: Trash2Icon })
    }

    if (isOriginalOwner) {
      tabs.push({ key: 'permissions', label: 'Permissions', icon: KeyIcon })
    }

    return tabs
  }

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
  const showSaveButton =
    activeTab !== 'integrations' &&
    activeTab !== 'tasks' &&
    activeTab !== 'memories' &&
    activeTab !== 'permissions' &&
    activeTab !== 'concepts' &&
    activeTab !== 'manage' &&
    activeTab !== 'dashboard'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                        agent={agent}
                        deployments={deploymentsQuery.deployments}
                        isLoading={deploymentsQuery.isPending}
                        isError={deploymentsQuery.isError}
                      />
                    )}

                    {activeTab === 'memories' && hasEditAccess && (
                      <AgentMemoryView agent={agent} variant="panel" />
                    )}

                    {activeTab === 'tasks' && hasEditAccess && (
                      <AgentTasksView agent={agent} variant="panel" />
                    )}

                    {activeTab === 'permissions' && isOriginalOwner && (
                      <PermissionsTab agent={agent} />
                    )}

                    {activeTab === 'dashboard' && hasEditAccess && (
                      <AgentDashboardView agent={agent} variant="panel" />
                    )}

                    {activeTab === 'manage' && hasOwnerAccess && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-destructive/60 bg-card p-6">
                          <p className="text-base font-semibold text-destructive">
                            Permanently delete this agent
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            This will remove the agent, its deployments, and any
                            associated data. This action cannot be undone.
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
                    )}
                  </form>
                </Form>
              </div>
            </ScrollArea>

            {/* Action Footer */}
            {showSaveButton && (
              <div className="border-t p-4 bg-background flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                <Button
                  onClick={form.handleSubmit(handleSubmit)}
                  disabled={form.formState.isSubmitting || isDeleting}
                  className="w-full md:w-auto"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Agent...
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
  )
}
