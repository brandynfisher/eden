'use client'

import { MAX_AGENTS } from '../session-config'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent, SessionPermission } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  Loader2,
  Plus,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
  auto_reply: z.boolean().default(false),
  reply_interval: z
    .number()
    .min(0, 'Reply interval must be at least 0')
    .max(3600, 'Reply interval must not exceed 3600 seconds')
    .default(0),
  actor_selection_method: z
    .enum(['random', 'random_exclude_last'])
    .default('random_exclude_last'),
  exclude_memory: z.boolean().default(false),
  permissions: z
    .array(
      z.object({
        username: z.string(),
        level: z.enum(['editor', 'owner']),
      }),
    )
    .default([]),
})

export type SessionFormValues = z.infer<typeof sessionFormSchema>

type SessionFormProps = {
  mode: 'create' | 'edit'
  defaultValues?: Partial<SessionFormValues>
  existingPermissions?: SessionPermission[]
  initialAgents?: Agent[]
  onSubmit: (data: SessionFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export const SessionForm = ({
  mode,
  defaultValues,
  initialAgents = [],
  onSubmit,
  isLoading = false,
  submitLabel,
}: SessionFormProps) => {
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>(initialAgents)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [permissionLevel, setPermissionLevel] = useState<'editor' | 'owner'>(
    'editor',
  )

  useEffect(() => {
    if (initialAgents.length > 0 && selectedAgents.length === 0) {
      setSelectedAgents(initialAgents)
    }
  }, [initialAgents])

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
      exclude_memory: false,
      permissions: [],
      ...defaultValues,
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

  const handleRemoveAgent = (agentId: string) => {
    const updatedAgents = selectedAgents.filter(agent => agent._id !== agentId)
    setSelectedAgents(updatedAgents)
    form.setValue(
      'agents',
      updatedAgents.map(agent => ({ _id: agent._id, name: agent.name })),
    )
  }

  const handleAddPermission = () => {
    if (!newUsername.trim()) return

    const currentPermissions = form.getValues('permissions')
    const exists = currentPermissions.some(
      p => p.username === newUsername.trim(),
    )

    if (exists) {
      return
    }

    form.setValue('permissions', [
      ...currentPermissions,
      { username: newUsername.trim(), level: permissionLevel },
    ])
    setNewUsername('')
  }

  const handleRemovePermission = (username: string) => {
    const currentPermissions = form.getValues('permissions')
    form.setValue(
      'permissions',
      currentPermissions.filter(p => p.username !== username),
    )
  }

  const owners = form.watch('permissions').filter(p => p.level === 'owner')
  const editors = form.watch('permissions').filter(p => p.level === 'editor')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="agents"
          render={() => (
            <FormItem>
              <FormControl>
                {selectedAgents.length === 0 ? (
                  <AgentSelectorModal
                    className="p-4 md:p-8 w-full"
                    title={`Select Agents for ${
                      mode === 'create' ? 'New' : 'Editing'
                    } Session`}
                    description="Choose one or more agents to include in your session."
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
                                  ? getCloudfrontOriginalUrl(agent.userImage)
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
                              {agent.owner?.username
                                ? `by @${agent.owner.username}`
                                : `@${agent.username}`}
                            </div>
                          </div>
                          {mode === 'edit' && selectedAgents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAgent(agent._id)}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <AgentSelectorModal
                      className="p-4 md:p-8 w-full"
                      title={`Select Agents for ${
                        mode === 'create' ? 'New' : 'Editing'
                      } Session`}
                      description="Choose one or more agents to include in your session."
                      selectedAgents={selectedAgents}
                      onChange={handleAgentSelection}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {mode === 'edit' ? 'Change Agents' : 'Add Agents'}
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

            {form.watch('auto_reply') && (
              <div className="space-y-6 pl-4 border-l-2 border-muted">
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
                        Delay between agent responses (0-3600 seconds, 0 = no
                        delay)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

            <FormField
              control={form.control}
              name="exclude_memory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Exclude Memory</FormLabel>
                    <FormDescription>
                      Disable memory injection into the system prompt
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

            {mode === 'edit' && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">
                    Session Permissions
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Grant users permission to view or manage this session.
                    Owners have full control, while editors can only view.
                  </p>

                  <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                          <ShieldIcon className="w-4 h-4" />
                          Owner Permissions
                        </div>
                        <div className="text-muted-foreground ml-6">
                          Full control: Edit session settings and manage
                          permissions
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Editor Permissions
                        </div>
                        <div className="text-muted-foreground ml-6">
                          Limited access: View session only
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Input
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      placeholder="Enter Eden username..."
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddPermission()
                        }
                      }}
                      className="flex-1"
                    />
                    <Select
                      value={permissionLevel}
                      onValueChange={value =>
                        setPermissionLevel(value as 'editor' | 'owner')
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddPermission}
                      disabled={!newUsername.trim()}
                      type="button"
                    >
                      Add
                    </Button>
                  </div>

                  {owners.length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium block mb-2">
                        Owners
                      </label>
                      <div className="space-y-2">
                        {owners.map(permission => (
                          <div
                            key={permission.username}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <ShieldIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {permission.username}
                              </span>
                              <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                Owner
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemovePermission(permission.username)
                              }
                              type="button"
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editors.length > 0 && (
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Editors
                      </label>
                      <div className="space-y-2">
                        {editors.map(permission => (
                          <div
                            key={permission.username}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <UserIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {permission.username}
                              </span>
                              <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                Editor
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemovePermission(permission.username)
                              }
                              type="button"
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            submitLabel ||
            (mode === 'create' ? 'Create Session' : 'Save Changes')
          )}
        </Button>
      </form>
    </Form>
  )
}
