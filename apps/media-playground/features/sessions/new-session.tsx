'use client'

import { SessionForm, SessionFormValues } from './components/session-form'
import { MAX_AGENTS } from './session-config'
import { useToast } from '@/components/ui/use-toast'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { MessageCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const NewSession = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { invalidate: invalidateSessionList } = useSessionListQuery({
    enabled: false,
  })

  const onSubmit = async (data: SessionFormValues) => {
    try {
      setIsLoading(true)

      const requestBody: {
        agent_ids: string[]
        title?: string
        scenario?: string
        budget?: {
          manna_budget?: number
          token_budget?: number
          turn_budget?: number
        }
        autonomy_settings?: {
          auto_reply: boolean
          reply_interval: number
          actor_selection_method: string
        }
        extras?: {
          exclude_memory?: boolean
        }
      } = {
        agent_ids: data.agents.map(agent => agent._id),
        autonomy_settings: {
          auto_reply: data.auto_reply,
          reply_interval: data.reply_interval,
          actor_selection_method: data.actor_selection_method,
        },
        extras: {
          exclude_memory: data.exclude_memory,
        },
      }

      if (data.title && data.title.trim()) {
        requestBody.title = data.title
      } else {
        const agentNames = data.agents.map(agent => agent.name).join(', ')
        requestBody.title =
          data.agents.length === 1
            ? `Chat with ${agentNames}`
            : `Multi-agent session with ${agentNames}`
      }

      if (data.scenario && data.scenario.trim()) {
        requestBody.scenario = data.scenario
      }

      const budget: {
        manna_budget?: number
        token_budget?: number
        turn_budget?: number
      } = {}
      if (!data.manna_budget_unlimited && data.manna_budget) {
        budget.manna_budget = data.manna_budget
      }
      if (!data.token_budget_unlimited && data.token_budget) {
        budget.token_budget = data.token_budget
      }
      if (!data.turn_budget_unlimited && data.turn_budget) {
        budget.turn_budget = data.turn_budget
      }
      if (Object.keys(budget).length > 0) {
        requestBody.budget = budget
      }

      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create session')
      }

      const result = await response.json()

      await invalidateSessionList()

      if (result.session?._id) {
        router.push(`/sessions/${result.session._id}`)

        toast({
          title: 'Session created successfully!',
          description: `Your session with ${data.agents.length} agent${
            data.agents.length > 1 ? 's' : ''
          } has been created.`,
        })
      }
    } catch (error) {
      console.error('Session creation error:', error)
      toast({
        title: 'Error creating session',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <MessageCircleIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Start a New Session
            </h2>
            <p className="text-muted-foreground">
              Create a new session by selecting agents (up to {MAX_AGENTS}) and
              configuring your session settings.
            </p>
          </div>
        </div>

        <SessionForm mode="create" onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default NewSession
