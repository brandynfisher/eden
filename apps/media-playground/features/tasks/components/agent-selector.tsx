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
import { useAgentsListQuery } from '@/hooks/query/use-agents-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, Loader2 } from 'lucide-react'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const agentSchema = z.object({
  agentId: z.string().min(1, 'Please select an agent'),
})

type AgentFormData = z.infer<typeof agentSchema>

type AgentSelectorProps = {
  onSelect: (agent: Agent) => void
  onCancel: () => void
}

export const AgentSelector: FC<AgentSelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const { user } = useAuthState()

  const { agents, isLoading, isError } = useAgentsListQuery({
    owner: user?._id,
    enabled: !!user?._id,
    limit: 100,
  })

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      agentId: '',
    },
  })

  const onSubmit = (values: AgentFormData) => {
    const selectedAgent = agents?.find(a => a._id === values.agentId)
    if (selectedAgent) {
      onSelect(selectedAgent)
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
        <h3 className="font-medium">Select Agent</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-muted-foreground">
                  Agent *
                </FormLabel>
                <FormControl>
                  {isLoading ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading agents...</span>
                    </div>
                  ) : isError ? (
                    <div className="p-2 text-sm text-destructive">
                      Error loading agents. Please try again.
                    </div>
                  ) : !agents || agents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No agents found. Create an agent first.
                    </div>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!agents || agents.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {agents.map(agent => (
                          <SelectItem key={agent._id} value={agent._id}>
                            {agent.name}
                          </SelectItem>
                        ))}
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
              disabled={isLoading || !agents || agents.length === 0}
            >
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
