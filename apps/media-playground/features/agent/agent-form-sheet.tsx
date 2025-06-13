'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
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
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import { ProfileImageUploader } from '@/features/chat/components/profile-image-uploader'
import TaskFormModal from '@/features/chat/components/task-form-modal'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentTriggersQuery } from '@/hooks/query/use-agent-triggers-query'
import { cn } from '@/lib/utils'
import { useAgentFormSheet } from '@/stores/dialogs/dialogs.selector'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { slugifyName } from '@/utils/slug.util'
import { Trigger } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  AlertCircle,
  ClockIcon,
  Edit2Icon,
  Loader2,
  PlusIcon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const agentSchema = z.object({
  name: z.string().min(1).max(42),
  key: z
    .string()
    .min(1)
    .max(42)
    .regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/, {
      message:
        'Key must only contain lowercase letters, numbers, underscores and dashes.',
    }),
  image: z.string().optional(),
  description: z.string().min(1).max(5000),
  greeting: z.string().max(140).optional(),
  voice: z.string().optional(),
  models: z
    .array(
      z.object({
        lora: z.string(),
        use_when: z.string().trim().max(500).min(1),
      }),
    )
    .optional(),
  persona: z.string().max(30000).optional(),
  isPersonaPublic: z.boolean().optional(),
  knowledge: z.string().max(100000).optional(),
  suggestions: z
    .array(
      z.object({
        label: z.string().min(1).max(140),
        prompt: z.string().min(1).max(10000),
      }),
    )
    .optional(),
})

type AgentFormDto = z.infer<typeof agentSchema>

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="ml-auto text-xs text-muted-foreground flex-shrink-0 text-right">
      {current}/{max} chars
    </div>
  )
}

const AgentFormSheet = () => {
  const { isOpen, mode, agentId, onAction } = useAgentFormSheet()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('profile')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Trigger | null>(null)

  const agentQuery = useAgentQuery({
    key: agentId || '',
    enabled: agentId && isOpen ? true : false,
    refetchOnWindowFocus: false,
  })

  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agentId || '',
    enabled: activeTab === 'deployments' && isOpen,
  })

  const triggersQuery = useAgentTriggersQuery({
    key: agentId || '',
    enabled: activeTab === 'tasks' && isOpen,
  })

  const [isKeyEditMode, setIsKeyEditMode] = useState(false)
  const [isManualKeyEdit, setIsManualKeyEdit] = useState(false)

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agentQuery.agent?.name || '',
      key: agentQuery.agent?.username || '',
      image: agentQuery.agent?.userImage || '',
      description: agentQuery.agent?.description || '',
      persona: agentQuery.agent?.persona || '',
      isPersonaPublic: agentQuery.agent?.isPersonaPublic || false,
      knowledge: agentQuery.agent?.knowledge ?? '',
      greeting: agentQuery.agent?.greeting || '',
      voice: agentQuery.agent?.voice || '',
      models: agentQuery.agent?.models || [],
      suggestions: agentQuery.agent?.suggestions || [],
    },
  })

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  const name = form.watch('name')
  const key = form.watch('key')

  useEffect(() => {
    if (agentQuery.agent) {
      form.reset({
        name: agentQuery.agent.name,
        key: agentQuery.agent.username,
        image: agentQuery.agent.userImage,
        description: agentQuery.agent.description,
        persona: agentQuery.agent.persona,
        isPersonaPublic: agentQuery.agent.isPersonaPublic,
        knowledge: agentQuery.agent.knowledge ?? '',
        greeting: agentQuery.agent.greeting || '',
        voice: agentQuery.agent.voice || '',
        models: agentQuery.agent.models || [],
        suggestions: agentQuery.agent.suggestions || [],
      })
    } else {
      form.reset({
        name: '',
        key: '',
        image: '',
        description: '',
        persona: '',
        isPersonaPublic: false,
        knowledge: '',
        greeting: '',
        voice: '',
        models: [],
        suggestions: [],
      })
    }
  }, [agentQuery.agent, form])

  useEffect(() => {
    if (!isManualKeyEdit && name && mode === 'create') {
      form.setValue('key', slugifyName(name))
    }
  }, [form, name, isManualKeyEdit, mode])

  const handleSubmit = async (data: AgentFormDto) => {
    try {
      if (mode === 'update') {
        await axios.patch(`/api/agents/${agentId}`, data)
        toast.success('Agent updated successfully', {
          description: `"${data.name}" has been updated successfully`,
          richColors: true,
          dismissible: true,
        })
        agentQuery.invalidate()
      } else {
        const agent = await axios.post('/api/agents', data)
        router.push(`/agents/${agent.data.agentId}`)
        toast.success('Agent created successfully', {
          description: `"${data.name}" has been created successfully`,
          richColors: true,
          dismissible: true,
        })
      }
      dispatch(
        updateAgentFormSheet({
          isOpen: false,
          mode: 'create',
          agentId: undefined,
        }),
      )
      await onAction?.()
    } catch (error) {
      toast.error(
        `${mode === 'update' ? 'Agent update' : 'Agent creation'} failed`,
        {
          description:
            // @ts-expect-error needs proper typings
            (error as AxiosError).response?.data?.message ||
            'Unknown Error has occurred',
          richColors: true,
          dismissible: true,
        },
      )
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dispatch(
        updateAgentFormSheet({
          isOpen: false,
          mode: 'create',
          agentId: undefined,
        }),
      )
      form.reset({
        name: '',
        key: '',
        image: '',
        description: '',
        models: [],
      })
    }
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (trigger: Trigger) => {
    setEditingTask(trigger)
    setIsTaskModalOpen(true)
  }

  const handleTaskModalClose = (open: boolean) => {
    if (!open) {
      setEditingTask(null)
    }
    setIsTaskModalOpen(open)
  }

  const handleTaskSave = () => {
    triggersQuery.invalidate()
    setEditingTask(null)
    setIsTaskModalOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === 'update' ? 'Update Agent' : 'Create an Agent'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'update'
              ? 'Update your agent'
              : 'Create an agent to help you with your tasks.'}
          </SheetDescription>
        </SheetHeader>
        {mode === 'update' && agentQuery.isPending && (
          <div className="flex items-center justify-center mt-10">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {mode === 'update' && agentQuery.isError && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-destructive">
              We were unable to fetch agent. Please try again later.
            </p>
          </div>
        )}
        {(mode === 'create' || agentQuery.isSuccess) && (
          <div className="flex-1 overflow-auto">
            <div className="flex flex-col h-full">
              {/* Navigation Tabs */}
              <div className="flex gap-2 p-4 border-b border-border">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === 'profile'
                      ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('concepts')}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    activeTab === 'concepts'
                      ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  Concepts
                </button>
                {mode === 'update' && (
                  <>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'tasks'
                          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      Tasks
                    </button>
                    <button
                      onClick={() => setActiveTab('deployments')}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'deployments'
                          ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      Deployments
                    </button>
                  </>
                )}
              </div>

              <Form {...form}>
                <form
                  className="w-full space-y-4 p-4"
                  onSubmit={form.handleSubmit(handleSubmit)}
                >
                  {activeTab === 'profile' && (
                    <div className="space-y-4">
                      {/* Name Field with Key */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-card rounded-xl border border-border">
                            <FormLabel className="text-base font-medium">
                              Display Name
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="My helpful Agent"
                                {...field}
                                onChange={e => {
                                  field.onChange(e.target.value.slice(0, 42))
                                }}
                              />
                            </FormControl>
                            {field.value && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="text-sm text-muted-foreground flex-1">
                                  {isKeyEditMode ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="text"
                                        value={key}
                                        placeholder="unique-name"
                                        onChange={e => {
                                          const value = e.target.value
                                            .toLowerCase()
                                            .slice(0, 42)
                                          form.setValue('key', value)
                                          setIsManualKeyEdit(true)
                                        }}
                                        onBlur={e => {
                                          form.setValue(
                                            'key',
                                            slugifyName(e.target.value),
                                          )
                                          setIsKeyEditMode(false)
                                        }}
                                        className="h-7 text-sm"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span>
                                        Auto generated unique name: {key}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => setIsKeyEditMode(true)}
                                      >
                                        <Edit2Icon size={12} />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap mt-1">
                              <FormDescription>
                                Friendly Name of your agent. This will be
                                displayed to users.
                              </FormDescription>
                              <CharacterCount
                                current={field.value?.length || 0}
                                max={42}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Image Field */}
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-card rounded-xl border border-border">
                            <FormLabel className="text-base font-medium">
                              Profile Image
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                className={'hidden'}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                value={
                                  field.value === null ? '' : field.value || ''
                                }
                              />
                            </FormControl>
                            <div className="mt-4">
                              <ProfileImageUploader
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description Field */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-card rounded-xl border border-border">
                            <FormLabel className="text-base font-medium">
                              Description
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormDescription className="mt-1 mb-3">
                              Short description of the agent shown on profile
                              and cards.
                            </FormDescription>
                            <FormControl>
                              <AutosizeTextarea
                                placeholder="This agent helps you with your tasks"
                                {...field}
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <div className="flex justify-end mt-2">
                              <CharacterCount
                                current={field.value?.length || 0}
                                max={5000}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Persona Field */}
                      <div className="p-4 bg-card rounded-xl border border-border flex flex-col gap-4">
                        <FormField
                          control={form.control}
                          name="persona"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium">
                                Persona
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormDescription className="mt-1 mb-3">
                                Personality and behaviour of the agent. This
                                won't be visible to others.
                              </FormDescription>
                              <FormControl>
                                <AutosizeTextarea
                                  placeholder="You are a helpful agent, always ready to help users with their tasks"
                                  {...field}
                                  className="min-h-[120px]"
                                />
                              </FormControl>
                              <div className="flex justify-end mt-2">
                                <CharacterCount
                                  current={field.value?.length || 0}
                                  max={30000}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isPersonaPublic"
                          render={({ field }) => (
                            <FormItem className="bg-background p-4 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex flex-col gap-1">
                                <FormLabel>Public Persona</FormLabel>
                                <FormDescription>
                                  Whether the persona is public to others.
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
                      </div>

                      {/* Greeting Field */}
                      <FormField
                        control={form.control}
                        name="greeting"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-card rounded-xl border border-border">
                            <FormLabel className="text-base font-medium">
                              Greeting
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormDescription className="mt-1 mb-3">
                              This will be displayed to users when they first
                              interact with the agent.
                            </FormDescription>
                            <FormControl>
                              <AutosizeTextarea
                                placeholder="Hello, how can I help you today?"
                                {...field}
                                className="min-h-[60px]"
                              />
                            </FormControl>
                            <div className="flex justify-end mt-2">
                              <CharacterCount
                                current={field.value?.length || 0}
                                max={140}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {activeTab === 'concepts' && (
                    <div className="space-y-4">
                      {/* Voice Field */}
                      <FormField
                        control={form.control}
                        name="voice"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-card rounded-xl border border-border">
                            <FormLabel className="text-base font-medium">
                              Voice (Optional)
                            </FormLabel>
                            <FormDescription className="mt-1 mb-3">
                              Your agent will speak with this voice. Voices
                              provided by ElevenLabs.
                            </FormDescription>
                            <FormControl>
                              <VoiceSelector
                                value={field.value || ''}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Models Field */}
                      <FormField
                        control={form.control}
                        name="models"
                        render={() => (
                          <FormItem className="p-4 bg-card rounded-xl border border-border">
                            <FormLabel className="text-base font-medium">
                              Flux LoRA Models
                            </FormLabel>
                            <FormDescription className="mt-1 mb-3">
                              Select models and specify when to use each one
                              (max 10 models).
                            </FormDescription>
                            <div>
                              {models.fields.map((model, index) => (
                                <div
                                  key={model.lora}
                                  className="relative mb-4 p-4 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                                >
                                  <div className="flex items-start gap-4">
                                    <ModelMiniCard
                                      modelId={model.lora}
                                      className="w-24 h-24"
                                    />
                                    <div className="flex-1 space-y-2">
                                      <FormField
                                        control={form.control}
                                        name={`models.${index}.use_when`}
                                        render={({ field }) => (
                                          <FormItem className="flex-1">
                                            <FormLabel className="text-sm text-muted-foreground">
                                              When to use this model
                                            </FormLabel>
                                            <FormControl>
                                              <Input
                                                type="text"
                                                placeholder="e.g., 'when user asks for realistic images' or 'for anime style'"
                                                {...field}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => models.remove(index)}
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <div className="mt-4">
                                <ModelSelectorModal
                                  className="p-4 md:p-8 w-full"
                                  title="Select LoRA Model"
                                  description="Pick a LoRA model to add to this agent"
                                  currentValue=""
                                  selectedIds={models.fields.map(m => m.lora)}
                                  onChange={id => {
                                    const modelId =
                                      typeof id === 'string' ? id : id[0]
                                    if (!modelId) return

                                    // Check if model already exists (shouldn't happen due to disabled state)
                                    if (
                                      models.fields.some(
                                        m => m.lora === modelId,
                                      )
                                    ) {
                                      toast.error('This model is already added')
                                      return
                                    }

                                    // Add new model
                                    form.setValue('models', [
                                      ...models.fields,
                                      { lora: modelId, use_when: '' },
                                    ])
                                  }}
                                  trigger={
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={models.fields.length >= 10}
                                      className="w-full"
                                    >
                                      Add LoRA Model
                                    </Button>
                                  }
                                />
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {activeTab === 'tasks' && mode === 'update' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-card rounded-xl border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Tasks</h3>
                          <Button onClick={handleCreateTask} className="gap-2">
                            <PlusIcon className="w-4 h-4" />
                            Create Task
                          </Button>
                        </div>

                        {triggersQuery.isPending && (
                          <div className="flex items-center justify-center mt-10">
                            <Loader2 className="size-4 animate-spin" />
                          </div>
                        )}

                        {triggersQuery.isError && (
                          <div className="flex items-center justify-center gap-2 mt-10">
                            <AlertCircle className="size-4 text-destructive" />
                            <p className="text-destructive">
                              We were unable to fetch your tasks. Please try
                              again later.
                            </p>
                          </div>
                        )}

                        {triggersQuery.isSuccess && (
                          <div className="space-y-4">
                            {triggersQuery.triggers?.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">
                                  No scheduled tasks
                                </p>
                                <p className="text-sm">
                                  Create your first automated task to get
                                  started.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {triggersQuery.triggers?.map(trigger => (
                                  <div
                                    key={trigger._id}
                                    className="p-4 bg-background rounded-lg border border-border"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">
                                          {trigger.message}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          Platform: {trigger.platform}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTask(trigger)}
                                      >
                                        <Edit2Icon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {agentQuery.agent && (
                        <TaskFormModal
                          agent={agentQuery.agent}
                          editingTask={editingTask}
                          open={isTaskModalOpen}
                          onOpenChange={handleTaskModalClose}
                          onSave={handleTaskSave}
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'deployments' && mode === 'update' && (
                    <div className="space-y-4">
                      {deploymentsQuery.isPending && (
                        <div className="flex items-center justify-center mt-10">
                          <Loader2 className="size-4 animate-spin" />
                        </div>
                      )}

                      {deploymentsQuery.isError && (
                        <div className="flex items-center justify-center gap-2 mt-10">
                          <AlertCircle className="size-4 text-destructive" />
                          <p className="text-destructive">
                            We were unable to fetch your deployments. Please try
                            again later.
                          </p>
                        </div>
                      )}

                      {deploymentsQuery.isSuccess && (
                        <div className="space-y-4">
                          <DiscordDeploymentForm
                            agentId={agentId || ''}
                            deployment={deploymentsQuery.deployments?.find(
                              deployment => deployment.platform === 'discord',
                            )}
                          />
                          <TelegramDeploymentForm
                            agentId={agentId || ''}
                            deployment={deploymentsQuery.deployments?.find(
                              deployment => deployment.platform === 'telegram',
                            )}
                          />
                          <TwitterDeploymentForm
                            agentId={agentId || ''}
                            deployment={deploymentsQuery.deployments?.find(
                              deployment => deployment.platform === 'twitter',
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  {activeTab !== 'deployments' && activeTab !== 'tasks' && (
                    <SheetFooter className="mt-6">
                      <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {mode === 'update' ? 'Updating...' : 'Creating...'}
                          </>
                        ) : mode === 'update' ? (
                          'Update Agent'
                        ) : (
                          'Create Agent'
                        )}
                      </Button>
                    </SheetFooter>
                  )}
                </form>
              </Form>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default AgentFormSheet
