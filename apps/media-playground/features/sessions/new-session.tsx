'use client'

import SliderInput from '@/components/form/input/slider-input'
import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MessageCircleIcon, UsersIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const sessionFormSchema = z.object({
  agents: z
    .array(
      z.object({
        _id: z.string(),
        name: z.string(),
      }),
    )
    .min(1, 'Please select at least one agent'),
  scenario: z
    .string()
    .min(10, 'Scenario must be at least 10 characters')
    .max(1000, 'Scenario must not exceed 1000 characters'),
  budget: z
    .number()
    .min(100, 'Budget must be at least 100')
    .max(5000, 'Budget must not exceed 5000'),
})

type SessionFormValues = z.infer<typeof sessionFormSchema>

const NewSession = () => {
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      agents: [],
      scenario: '',
      budget: 1000,
    },
  })

  const handleAgentSelection = (agents: Agent[]) => {
    setSelectedAgents(agents)
    form.setValue(
      'agents',
      agents.map(agent => ({ _id: agent._id, name: agent.name })),
    )
    form.clearErrors('agents')
  }

  const onSubmit = async (data: SessionFormValues) => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_ids: data.agents.map(agent => agent._id),
          scenario: data.scenario,
          budget: data.budget,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create session')
      }

      const result = await response.json()

      toast({
        title: 'Session created successfully!',
        description: `Your session with ${data.agents.length} agent${
          data.agents.length > 1 ? 's' : ''
        } has been created.`,
      })

      // Redirect to the created session
      if (result.session?._id) {
        router.push(`/sessions/${result.session._id}`)
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
              Create a new session by selecting agents, defining a scenario, and
              setting a budget.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Agent Selection */}
            <FormField
              control={form.control}
              name="agents"
              render={() => (
                <FormItem>
                  <FormLabel>Selected Agents</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <AgentSelectorModal
                        className="p-4 md:p-8 w-full"
                        title="Select Agents for Session"
                        description="Choose one or more agents to include in your new session."
                        selectedAgents={selectedAgents}
                        onChange={handleAgentSelection}
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                          >
                            <UsersIcon className="w-4 h-4 mr-2" />
                            {selectedAgents.length > 0
                              ? `${selectedAgents.length} Agent${
                                  selectedAgents.length > 1 ? 's' : ''
                                } Selected`
                              : 'Select Agents'}
                          </Button>
                        }
                      />

                      {selectedAgents.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <p className="font-medium text-sm">
                            Selected Agents:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAgents.map(agent => (
                              <div
                                key={agent._id}
                                className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                              >
                                <UsersIcon className="w-3 h-3" />
                                {agent.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scenario */}
            <FormField
              control={form.control}
              name="scenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario</FormLabel>
                  <FormControl>
                    <AutosizeTextarea
                      placeholder="Describe what you want to accomplish in this session..."
                      variant="lg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the context or goal for this session (10-1000
                    characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget */}
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (Mana)</FormLabel>
                  <FormControl>
                    <SliderInput
                      type="integer"
                      value={field.value}
                      onChange={value => field.onChange(value)}
                      min={100}
                      max={5000}
                      step={100}
                      unit=" mana"
                    />
                  </FormControl>
                  <FormDescription>
                    Set a budget limit for this session (100-5000 mana)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || selectedAgents.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <MessageCircleIcon className="w-4 h-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default NewSession
