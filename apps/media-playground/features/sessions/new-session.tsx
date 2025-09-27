'use client'

import { MAX_AGENTS } from './session-config'
import SliderInput from '@/components/form/input/slider-input'
import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useSessionListQuery } from '@/hooks/query/use-session-list-query'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  Loader2,
  MessageCircleIcon,
  Plus,
  UsersIcon,
} from 'lucide-react'
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
    .min(1, 'Please select at least one agent')
    .max(MAX_AGENTS, `You can select a maximum of ${MAX_AGENTS} agents`),
  title: z
    .string()
    .max(1000, 'Title must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  scenario: z
    .string()
    .max(1000, 'Scenario must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  // Updated budget structure
  manna_budget_unlimited: z.boolean().default(true),
  manna_budget: z
    .number()
    .min(100, 'Manna budget must be at least 100')
    .max(50000, 'Manna budget must not exceed 50000')
    .optional(),
  token_budget_unlimited: z.boolean().default(true),
  token_budget: z
    .number()
    .min(1000, 'Token budget must be at least 1000')
    .max(1000000, 'Token budget must not exceed 1000000')
    .optional(),
  turn_budget_unlimited: z.boolean().default(true),
  turn_budget: z
    .number()
    .min(1, 'Turn budget must be at least 1')
    .max(1000, 'Turn budget must not exceed 1000')
    .optional(),
  // Autonomy settings
  auto_reply: z.boolean().default(false),
  reply_interval: z
    .number()
    .min(0, 'Reply interval must be at least 0')
    .max(3600, 'Reply interval must not exceed 3600 seconds')
    .default(0),
  actor_selection_method: z
    .enum(['random', 'random_exclude_last'])
    .default('random_exclude_last'),
})

type SessionFormValues = z.infer<typeof sessionFormSchema>

const NewSession = () => {
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { invalidate: invalidateSessionList } = useSessionListQuery({
    enabled: false, // Don't fetch sessions here, just get the invalidate function
  })

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      agents: [],
      title: '',
      scenario: '',
      manna_budget_unlimited: true,
      manna_budget: 1000,
      token_budget_unlimited: true,
      token_budget: 10000,
      turn_budget_unlimited: true,
      turn_budget: 100,
      auto_reply: false,
      reply_interval: 0,
      actor_selection_method: 'random_exclude_last',
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
      } = {
        agent_ids: data.agents.map(agent => agent._id),
        autonomy_settings: {
          auto_reply: data.auto_reply,
          reply_interval: data.reply_interval,
          actor_selection_method: data.actor_selection_method,
        },
      }

      // Set title - use provided title or generate default
      if (data.title && data.title.trim()) {
        requestBody.title = data.title
      } else {
        // Generate default title based on agents
        const agentNames = data.agents.map(agent => agent.name).join(', ')
        requestBody.title =
          data.agents.length === 1
            ? `Chat with ${agentNames}`
            : `Multi-agent session with ${agentNames}`
      }

      if (data.scenario && data.scenario.trim()) {
        requestBody.scenario = data.scenario
      }

      // Handle budget - only include if not unlimited
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

      // Invalidate session list to refresh sidebar
      await invalidateSessionList()

      // Redirect to the created session immediately
      if (result.session?._id) {
        router.push(`/sessions/${result.session._id}`)

        // Show success toast after redirect starts
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Agent Selection */}
            <FormField
              control={form.control}
              name="agents"
              render={() => (
                <FormItem>
                  <FormControl>
                    {selectedAgents.length === 0 ? (
                      /* Empty state - Large Select Agents button */
                      <AgentSelectorModal
                        className="p-4 md:p-8 w-full"
                        title="Select Agents for New Session"
                        description="Choose one or more agents to include in your new session."
                        selectedAgents={selectedAgents}
                        onChange={handleAgentSelection}
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-20 text-lg border-dashed border-2 hover:border-primary/50 transition-colors"
                          >
                            <UsersIcon className="w-6 h-6 mr-3" />
                            Select Agents
                          </Button>
                        }
                      />
                    ) : (
                      /* Selected agents preview */
                      <div className="space-y-4">
                        <div className="max-h-80 overflow-y-auto space-y-2">
                          {selectedAgents.map(agent => (
                            <div
                              key={agent._id}
                              className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border"
                            >
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarImage
                                  src={
                                    agent.userImage && agent.userImage.trim()
                                      ? getCloudfrontOriginalUrl(
                                          agent.userImage,
                                        )
                                      : undefined
                                  }
                                  alt={agent.name}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-muted text-sm font-medium">
                                  {agent.name?.slice(0, 2).toUpperCase() || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base text-foreground truncate">
                                  {agent.name}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  by @{agent.username}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <AgentSelectorModal
                          className="p-4 md:p-8 w-full"
                          title="Select Agents for New Session"
                          description="Choose one or more agents to include in your new session."
                          selectedAgents={selectedAgents}
                          onChange={handleAgentSelection}
                          trigger={
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Agents
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <AutosizeTextarea
                      placeholder="Give your session a title..."
                      variant="sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional title for your session (max 1000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Advanced Settings */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto text-left"
                >
                  <span className="font-medium">Advanced Settings</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isAdvancedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 pt-4">
                {/* Scenario */}
                <FormField
                  control={form.control}
                  name="scenario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scenario (Optional)</FormLabel>
                      <FormControl>
                        <AutosizeTextarea
                          placeholder="Describe what you want to accomplish in this session..."
                          variant="lg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional context or goal for this session (max 1000
                        characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manna Budget */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="manna_budget_unlimited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Unlimited Manna Budget
                          </FormLabel>
                          <FormDescription>
                            Allow unlimited manna spending for this session
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!form.watch('manna_budget_unlimited') && (
                    <FormField
                      control={form.control}
                      name="manna_budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manna Budget</FormLabel>
                          <FormControl>
                            <SliderInput
                              type="integer"
                              value={field.value || 1000}
                              onChange={value => field.onChange(value)}
                              min={100}
                              max={50000}
                              step={100}
                              unit=" manna"
                            />
                          </FormControl>
                          <FormDescription>
                            Budget limit for manna spending (100-50000 manna)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Token Budget */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="token_budget_unlimited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Unlimited Token Budget
                          </FormLabel>
                          <FormDescription>
                            Allow unlimited token usage for this session
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!form.watch('token_budget_unlimited') && (
                    <FormField
                      control={form.control}
                      name="token_budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Budget</FormLabel>
                          <FormControl>
                            <SliderInput
                              type="integer"
                              value={field.value || 10000}
                              onChange={value => field.onChange(value)}
                              min={1000}
                              max={1000000}
                              step={1000}
                              unit=" tokens"
                            />
                          </FormControl>
                          <FormDescription>
                            Budget limit for token usage (1000-1000000 tokens)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Turn Budget */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="turn_budget_unlimited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Unlimited Turn Budget
                          </FormLabel>
                          <FormDescription>
                            Allow unlimited turn spending for this session
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!form.watch('turn_budget_unlimited') && (
                    <FormField
                      control={form.control}
                      name="turn_budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Turn Budget</FormLabel>
                          <FormControl>
                            <SliderInput
                              type="integer"
                              value={field.value || 100}
                              onChange={value => field.onChange(value)}
                              min={1}
                              max={1000}
                              step={1}
                              unit=" turns"
                            />
                          </FormControl>
                          <FormDescription>
                            Budget limit for conversation turns (1-1000 turns)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Auto Reply */}
                <FormField
                  control={form.control}
                  name="auto_reply"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto Reply</FormLabel>
                        <FormDescription>
                          Enable automatic responses between agents
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Auto Reply Settings - only show when auto_reply is enabled */}
                {form.watch('auto_reply') && (
                  <div className="space-y-6 pl-4 border-l-2 border-muted">
                    {/* Reply Interval */}
                    <FormField
                      control={form.control}
                      name="reply_interval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reply Interval</FormLabel>
                          <FormControl>
                            <SliderInput
                              type="integer"
                              value={field.value || 0}
                              onChange={value => field.onChange(value)}
                              min={0}
                              max={3600}
                              step={5}
                              unit=" seconds"
                            />
                          </FormControl>
                          <FormDescription>
                            Delay between agent responses (0-3600 seconds, 0 =
                            no delay)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Actor Selection Method */}
                    <FormField
                      control={form.control}
                      name="actor_selection_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actor Selection Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select how agents are chosen to respond" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="random">Random</SelectItem>
                              <SelectItem value="random_exclude_last">
                                Random (Exclude Last Speaker)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How agents are selected to respond in multi-agent
                            sessions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

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
