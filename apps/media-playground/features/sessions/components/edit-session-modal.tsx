'use client'

import { SessionForm, SessionFormValues } from './session-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import {
  Agent,
  SessionPermission,
  SessionType,
  SessionV2,
} from '@edenlabs/eden-sdk'
import { Settings2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type EditSessionModalProps = {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EditSessionModal = ({
  sessionId,
  open,
  onOpenChange,
}: EditSessionModalProps) => {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [permissions, setPermissions] = useState<SessionPermission[]>([])

  const { data: session, refetch } = useSessionQuery({
    sessionId,
    enabled: !!sessionId && open,
  })

  useEffect(() => {
    if (open && sessionId) {
      fetch(`/api/sessions/${sessionId}/permissions`)
        .then(res => res.json())
        .then(data => {
          if (data.permissions) {
            setPermissions(
              data.permissions.map((p: SessionPermission) => ({
                username: p.user?.username,
                level: p.level,
              })),
            )
          }
        })
        .catch(err => {
          console.error('Failed to fetch permissions:', err)
        })
    }
  }, [open, sessionId])

  const onSubmit = async (data: SessionFormValues) => {
    try {
      setIsLoading(true)

      const requestBody: Partial<SessionV2> & { agent_ids: string[] } = {
        agent_ids: data.agents.map(agent => agent._id),
        session_type:
          data.type === 'natural' ? SessionType.NATURAL : SessionType.AUTOMATIC,
        settings: {
          conductor_prompt: data.conductor_prompt,
          delay_interval: data.delay_interval,
          mention_force_reply: data.mention_force_reply,
        },
      }

      if (data.context && data.context.trim()) {
        requestBody.context = data.context
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

      const updateResponse = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.message || 'Failed to update session')
      }

      if (data.permissions && data.permissions.length > 0) {
        const permissionsResponse = await fetch(
          `/api/sessions/${sessionId}/permissions`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permissions: data.permissions }),
          },
        )

        if (!permissionsResponse.ok) {
          const errorData = await permissionsResponse.json()
          throw new Error(errorData.error || 'Failed to update permissions')
        }
      }

      await refetch()

      toast({
        title: 'Session updated successfully!',
        description: 'Your changes have been saved.',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Session update error:', error)
      toast({
        title: 'Error updating session',
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

  if (!session) {
    return null
  }

  const defaultValues: Partial<SessionFormValues> = {
    agents: session.agents.map((agent: Agent) => ({
      _id: agent._id,
      name: agent.name,
    })),
    type: (session.session_type as 'natural' | 'automatic') || 'natural',
    context: session.context || '',
    conductor_prompt: session.settings?.conductor_prompt || '',
    delay_interval: session.settings?.delay_interval || 0,
    mention_force_reply: session.settings?.mention_force_reply || false,
    manna_budget_unlimited: !session.budget?.manna_budget,
    manna_budget: session.budget?.manna_budget || 1000,
    token_budget_unlimited: !session.budget?.token_budget,
    token_budget: session.budget?.token_budget || 10000,
    turn_budget_unlimited: !session.budget?.turn_budget,
    turn_budget: session.budget?.turn_budget || 100,
    permissions: permissions.map(p => ({
      username: p.user?.username,
      level: p.level,
    })),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Settings2Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update your session settings, agents, and permissions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <SessionForm
          mode="edit"
          defaultValues={defaultValues}
          existingPermissions={permissions}
          initialAgents={session.agents}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
