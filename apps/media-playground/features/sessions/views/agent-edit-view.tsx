'use client'

import {
  ConceptsTab,
  IntegrationsTab,
  PermissionsTab,
  ProfileTab,
  ToolsTab,
} from './AgentEditView'
import AgentDashboardView from './agent-dashboard-view'
import AgentMemoryView2 from './agent-memory-view2'
import AgentTasksView from './agent-tasks-view'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Form } from '@/components/ui/form'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { hasPreviewAccess } from '@/hooks/use-gated-resource'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  BarChart3Icon,
  BrainIcon,
  ChevronDownIcon,
  ClockIcon,
  ImageIcon,
  KeyIcon,
  Loader2,
  SettingsIcon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

const AgentEditView: FC<{
  agent: Agent
  user: unknown
  sessionId?: string
  onBackToChat?: () => void
  onNewChat?: () => void
}> = ({ agent }) => {
  const { user } = useAuthState()
  const searchParams = useSearchParams()
  const isPreviewUser = hasPreviewAccess(user?.featureFlags)

  // Get initial active tab from URL parameter or default to 'profile'
  const getInitialActiveTab = () => {
    const tabFromUrl = searchParams?.get('tab')
    if (
      tabFromUrl &&
      [
        'profile',
        'tools',
        'concepts',
        'integrations',
        'memories',
        'tasks',
        'permissions',
        'dashboard',
      ].includes(tabFromUrl)
    ) {
      return tabFromUrl
    }
    return 'profile'
  }

  const [activeTab, setActiveTab] = useState(getInitialActiveTab())

  // Fetch deployments (needed for both deployments tab and tools conditional logic)
  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agent._id,
    enabled: true,
  })

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      key: agent?.username || '',
      image:
        agent?.userImage && agent.userImage.trim()
          ? getCloudfrontOriginalUrl(agent.userImage)
          : '',
      description: agent?.description || '',
      persona: agent?.persona || '',
      public: agent?.public || false,
      knowledge: agent?.knowledge ?? '',
      greeting: agent?.greeting || '',
      voice: agent?.voice || '',
      models: agent?.models || [],
      tools: agent.tools || {},
      llm_settings: {
        model_profile: agent?.llm_settings?.model_profile || 'medium',
        thinking_policy: agent?.llm_settings?.thinking_policy || 'auto',
        thinking_effort_cap:
          agent?.llm_settings?.thinking_effort_cap || 'medium',
        thinking_effort_instructions:
          agent?.llm_settings?.thinking_effort_instructions || '',
      },
    },
  })

  // Update active tab when URL search parameters change
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab')
    if (
      tabFromUrl &&
      [
        'profile',
        'tools',
        'concepts',
        'integrations',
        'memories',
        'tasks',
        'permissions',
        'dashboard',
      ].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

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
    try {
      // Handle image field - convert back to filename if it's an existing image
      let imageToSend = data.image
      if (data.image && agent.userImage) {
        // Check if the current image is the same as the original (existing image)
        const originalImageUrl = getCloudfrontOriginalUrl(agent.userImage)
        if (data.image === originalImageUrl) {
          // This is the existing image, send just the filename
          imageToSend = agent.userImage
        }
        // If it's a new URL (from upload), send the full URL
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

  // Check user permissions using the new hook
  const {
    isOriginalOwner,
    hasOwnerAccess,
    hasEditAccess,
    isLoading: isPermissionsLoading,
  } = useAgentPermissions(agent, user?._id)

  // Mobile header component removed - users should access new chat via sidebar

  if (isPermissionsLoading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs: Array<{
      key: string
      label: string
      icon: typeof UserIcon
    }> = []

    if (hasEditAccess) {
      tabs.push({ key: 'profile', label: 'Profile', icon: UserIcon })
    }
    // Tasks - accessible to editors (preview only)
    if (hasEditAccess && isPreviewUser) {
      tabs.push({ key: 'tasks', label: 'Tasks', icon: ClockIcon })
    }
    if (hasEditAccess) {
      tabs.push({ key: 'dashboard', label: 'Dashboard', icon: BarChart3Icon })
    }
    // Concepts - accessible to editors
    if (hasEditAccess) {
      tabs.push({ key: 'concepts', label: 'Concepts', icon: ImageIcon })
    }
    // Memories - accessible to editors (preview only)
    if (hasEditAccess && isPreviewUser) {
      tabs.push({ key: 'memories', label: 'Memories', icon: BrainIcon })
    }
    // Tools - accessible to editors
    if (hasEditAccess) {
      tabs.push({ key: 'tools', label: 'Tools', icon: WrenchIcon })
    }
    // Integrations - restricted to owners only
    if (hasOwnerAccess && isPreviewUser) {
      tabs.push({
        key: 'integrations',
        label: 'Integrations',
        icon: SettingsIcon,
      })
    }
    // Permissions - restricted to original owner only
    if (isOriginalOwner && isPreviewUser) {
      tabs.push({ key: 'permissions', label: 'Permissions', icon: KeyIcon })
    }

    return tabs
  }

  const availableTabs = getAvailableTabs()
  const currentTab =
    availableTabs.find(tab => tab.key === activeTab) || availableTabs[0]
  const currentTabLabel = currentTab?.label || 'Profile'
  const agentIdentifier =
    agent.username || agent.name || agent._id || 'Agent Details'

  return (
    <div className="flex-1 bg-background flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 pt-6 md:pt-6">
          {/* Mobile header with title and dropdown */}
          <div className="mx-auto max-w-4xl mb-6 md:hidden">
            <h1 className="text-3xl font-semibold mb-4">Agent Settings</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="sm"
                >
                  <span className="flex items-center gap-2">
                    {currentTab && <currentTab.icon className="w-4 h-4" />}
                    {currentTab?.label || 'Agent Settings'}
                  </span>
                  <ChevronDownIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full" align="start">
                {availableTabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <DropdownMenuItem
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-2',
                        activeTab === tab.key && 'bg-accent',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-4 flex flex-col gap-1 text-left">
              <h2 className="text-2xl font-semibold">{currentTabLabel}</h2>
              <p className="text-sm text-muted-foreground break-words">
                {agentIdentifier}
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-4xl hidden md:flex flex-col gap-1 text-left lg:flex-row lg:items-baseline lg:justify-between lg:gap-3 mb-8">
            <h1 className="text-3xl font-semibold">{currentTabLabel}</h1>
            <p className="text-base text-muted-foreground break-words">
              {agentIdentifier}
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
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
                {activeTab === 'integrations' &&
                  hasOwnerAccess &&
                  isPreviewUser && (
                    <IntegrationsTab
                      agent={agent}
                      deployments={deploymentsQuery.deployments}
                      isLoading={deploymentsQuery.isPending}
                      isError={deploymentsQuery.isError}
                    />
                  )}
                {activeTab === 'memories' && hasEditAccess && isPreviewUser && (
                  <AgentMemoryView2
                    agent={agent}
                    agentQueryKey={String(agent._id)}
                    variant="panel"
                  />
                )}
                {activeTab === 'tasks' && hasEditAccess && isPreviewUser && (
                  <AgentTasksView agent={agent} variant="panel" />
                )}
                {activeTab === 'permissions' &&
                  isOriginalOwner &&
                  isPreviewUser && <PermissionsTab agent={agent} />}
                {activeTab === 'dashboard' && hasEditAccess && (
                  <AgentDashboardView agent={agent} variant="panel" />
                )}
              </form>
            </Form>

            {/* Global Update Button */}
            {activeTab !== 'integrations' &&
              activeTab !== 'tasks' &&
              activeTab !== 'memories' &&
              activeTab !== 'permissions' &&
              activeTab !== 'concepts' &&
              activeTab !== 'dashboard' && (
                <div className="border-t border-border p-6 mt-8">
                  <div className="mx-auto max-w-4xl">
                    <Button
                      onClick={form.handleSubmit(handleSubmit)}
                      disabled={form.formState.isSubmitting}
                      className="w-full"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating Agent...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default AgentEditView
