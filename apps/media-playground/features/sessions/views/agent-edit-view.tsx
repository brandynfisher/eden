'use client'

import {
  ConceptsTab,
  IntegrationsTab,
  PermissionsTab,
  ProfileTab,
  ToolsTab,
} from './AgentEditView'
import AgentDashboardView from './agent-dashboard-view'
import AgentMemoryView from './agent-memory-view'
import AgentTasksView from './agent-tasks-view'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
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
  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

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
      <div className="flex-1 bg-accent flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-accent flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 pt-6 md:pt-6">
          <div className="mx-auto max-w-4xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                {activeTab === 'profile' && (
                  <ProfileTab form={form} agent={agent} />
                )}

                {activeTab === 'tools' && hasOwnerAccess && (
                  <ToolsTab
                    form={form}
                    hasDeployments={
                      deploymentsQuery.deployments &&
                      deploymentsQuery.deployments.length > 0
                    }
                    user={user}
                  />
                )}
                {activeTab === 'concepts' && hasOwnerAccess && (
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
                {activeTab === 'memories' &&
                  hasOwnerAccess &&
                  isPreviewUser && (
                    <div className="-m-6">
                      <AgentMemoryView agent={agent} />
                    </div>
                  )}
                {activeTab === 'tasks' && hasOwnerAccess && isPreviewUser && (
                  <div className="-m-6">
                    <AgentTasksView agent={agent} />
                  </div>
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
