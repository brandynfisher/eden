'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AgentAvatars } from '@/features/sessions/components/agent-avatars'
import { useAgentSessionListQuery } from '@/hooks/query/use-agent-session-list-query'
import { SessionV2, TriggerSessionAgent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, Loader2 } from 'lucide-react'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const sessionSchema = z.object({
  sessionId: z.string().min(1, 'Please select a session'),
})

type SessionFormData = z.infer<typeof sessionSchema>

type SessionSelectorProps = {
  agentId: string
  onSelect: (session: SessionV2) => void
  onCancel: () => void
}

export const SessionSelector: FC<SessionSelectorProps> = ({
  agentId,
  onSelect,
  onCancel,
}) => {
  const { sessions, isLoading, isError } = useAgentSessionListQuery({
    agentId,
    enabled: !!agentId,
  })

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      sessionId: '',
    },
  })

  const onSubmit = (values: SessionFormData) => {
    const selectedSession = sessions?.find(s => s?._id === values.sessionId)
    if (selectedSession) {
      onSelect(selectedSession)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 -ml-1.5 rounded-md hover:bg-muted"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h3 className="font-medium">Select Session</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sessionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Session *
                </FormLabel>
                <FormControl>
                  {isLoading ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading sessions...</span>
                    </div>
                  ) : isError ? (
                    <div className="p-2 text-sm text-destructive">
                      Error loading sessions. Please try again.
                    </div>
                  ) : !sessions || sessions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No sessions found with this agent. Start a chat to create
                      a session.
                    </div>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!sessions || sessions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a session" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {sessions.map(session => {
                          const sessionAgents = (
                            typeof session?.agents !== 'undefined'
                              ? session.agents
                              : []
                          ) as TriggerSessionAgent[]

                          return (
                            <SelectItem
                              key={session?._id}
                              value={session?._id ?? ''}
                            >
                              <div className="flex items-center gap-2 w-full">
                                {sessionAgents.length > 0 && (
                                  <AgentAvatars
                                    agents={sessionAgents.map(a => ({
                                      _id: a._id,
                                      username: a.username,
                                      name: a.name || a.username,
                                      userImage: a.userImage,
                                    }))}
                                  />
                                )}
                                <span className="flex-1">
                                  {session?.title || 'Untitled Session'}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !sessions || sessions.length === 0}
            >
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
