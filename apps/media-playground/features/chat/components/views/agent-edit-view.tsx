'use client'

import {
  IntegrationsTab,
  PermissionsTab,
  ProfileTab,
  ToolsTab,
} from './AgentEditView'
import AgentDashboardView from './agent-dashboard-view'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  BarChart3Icon,
  Loader2,
  MessageCircleIcon,
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
}> = ({ agent, onNewChat }) => {
  const { user } = useAuthState()
  const searchParams = useSearchParams()
  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  // Get initial active tab from URL parameter or default to 'profile'
  const getInitialActiveTab = () => {
    const tabFromUrl = searchParams?.get('tab')
    if (
      tabFromUrl &&
      [
        'profile',
        'concepts',
        'integrations',
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
    },
  })

  // Update active tab when URL search parameters change
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab')
    if (
      tabFromUrl &&
      [
        'profile',
        'concepts',
        'integrations',
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

  // Get available tabs
  const getAvailableTabs = () => {
    const tabs = []

    // All users with edit access can see profile
    if (hasEditAccess) {
      tabs.push({ key: 'profile', label: 'Profile', icon: UserIcon })
    }

    // Only owners can see tools, integrations, and permissions
    if (hasOwnerAccess) {
      tabs.push({ key: 'concepts', label: 'Tools', icon: WrenchIcon })

      if (isPreviewUser) {
        tabs.push({
          key: 'integrations',
          label: 'Integrations',
          icon: SettingsIcon,
        })

        // Only original owner can see permissions tab
        if (isOriginalOwner) {
          tabs.push({
            key: 'permissions',
            label: 'Permissions',
            icon: UserIcon,
          })
        }
      }
    }

    // All users with edit access can see dashboard
    if (hasEditAccess) {
      tabs.push({ key: 'dashboard', label: 'Dashboard', icon: BarChart3Icon })
    }

    return tabs
  }

  // Top tabs content component
  const TopTabsContent = () => {
    const availableTabs = getAvailableTabs()

    return (
      <div className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="px-6">
          {/* Desktop and mobile horizontal tabs */}
          <div className="hidden sm:flex space-x-8 overflow-x-auto">
            <div className="flex space-x-8 overflow-x-auto flex-1">
              {availableTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* New Chat icon - always show when in settings */}
            {onNewChat && (
              <div className="flex items-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNewChat}
                  className="px-3"
                  aria-label="New Chat"
                >
                  <MessageCircleIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile horizontal tabs */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between py-4">
              <div className="flex space-x-6 overflow-x-auto flex-1">
                {availableTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* New Chat icon - always show when in settings */}
              {onNewChat && (
                <div className="flex items-center pl-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNewChat}
                    className="px-3"
                    aria-label="New Chat"
                  >
                    <MessageCircleIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isPermissionsLoading) {
    return (
      <div className="flex-1 bg-accent flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-accent flex flex-col h-full">
      <TopTabsContent />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                {activeTab === 'profile' && (
                  <ProfileTab form={form} agent={agent} />
                )}

                {activeTab === 'concepts' && hasOwnerAccess && (
                  <ToolsTab
                    form={form}
                    hasDeployments={
                      deploymentsQuery.deployments &&
                      deploymentsQuery.deployments.length > 0
                    }
                  />
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
                {activeTab === 'permissions' &&
                  isOriginalOwner &&
                  isPreviewUser && <PermissionsTab agent={agent} />}
                {activeTab === 'dashboard' && hasEditAccess && (
                  <div className="-m-6">
                    <AgentDashboardView agent={agent} />
                  </div>
                )}
              </form>
            </Form>

            {/* Global Update Button */}
            {activeTab !== 'integrations' &&
              activeTab !== 'tasks' &&
              activeTab !== 'permissions' &&
              activeTab !== 'dashboard' && (
                <div className="border-t border-border p-6">
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
