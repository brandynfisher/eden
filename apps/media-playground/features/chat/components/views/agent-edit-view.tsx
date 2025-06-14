'use client'

import { ProfileImageUploader } from '../profile-image-uploader'
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
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import AgentTasksView from '@/features/chat/components/views/agent-tasks-view'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { cn } from '@/lib/utils'
import { slugifyName } from '@/utils/slug.util'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  AlertCircle,
  ChevronRightIcon,
  ClockIcon,
  Edit2Icon,
  Loader2,
  SettingsIcon,
  UserIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import * as React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Agent form schema (copied from agent-form-sheet.tsx)
function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="text-xs text-muted-foreground text-right">
      {current}/{max}
    </div>
  )
}

export const DeploymentSettingsInline: FC<{ agent: Agent }> = ({ agent }) => {
  const [ownerPays, setOwnerPays] = useState(agent.owner_pays || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        owner_pays: ownerPays,
      })
      toast.success('Deployment settings updated successfully', {
        description: 'Your changes have been saved.',
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to update deployment settings', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-background border p-4 rounded-lg flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Cover Usage Costs</label>
          <p className="text-sm text-muted-foreground">
            When enabled, you (the agent owner) will cover all usage costs. When
            disabled, users will pay for their own usage.
          </p>
        </div>
        <Switch checked={ownerPays} onCheckedChange={setOwnerPays} />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting} type="button">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  )
}

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
  image: z.string().min(1, 'Profile image is required'),
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
})

type AgentFormDto = z.infer<typeof agentSchema>

const AgentEditView: FC<{
  agent: Agent
  user: unknown
}> = ({ agent }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isKeyEditMode, setIsKeyEditMode] = useState(false)
  const [isManualKeyEdit, setIsManualKeyEdit] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Fetch deployments for the deployments tab
  const deploymentsQuery = useAgentDeploymentsQuery({
    key: agent._id,
    enabled: activeTab === 'deployments',
  })

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || '',
      key: agent?.username || '',
      image: agent?.userImage || '',
      description: agent?.description || '',
      persona: agent?.persona || '',
      isPersonaPublic: agent?.isPersonaPublic || false,
      knowledge: agent?.knowledge ?? '',
      greeting: agent?.greeting || '',
      voice: agent?.voice || '',
      models: agent?.models || [],
    },
  })

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  const name = form.watch('name')
  const key = form.watch('key')

  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        key: agent.username,
        image: agent.userImage,
        description: agent.description,
        persona: agent.persona,
        isPersonaPublic: agent.isPersonaPublic,
        knowledge: agent.knowledge ?? '',
        greeting: agent.greeting || '',
        voice: agent.voice || '',
        models: agent.models || [],
      })
    }
  }, [agent, form])

  useEffect(() => {
    if (!isManualKeyEdit && name) {
      form.setValue('key', slugifyName(name))
    }
  }, [form, name, isManualKeyEdit])

  const handleSubmit = async (data: AgentFormDto) => {
    try {
      await axios.patch(`/api/agents/${agent._id}`, data)
      toast.success('Agent updated successfully', {
        description: `"${data.name}" has been updated successfully`,
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Agent update failed', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    }
  }

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Edit {agent.name}</h2>
        <p className="text-sm text-muted-foreground">Configure your agent</p>
      </div>
      <div className="flex-1 p-2">
        <div className="space-y-1">
          <button
            onClick={() => {
              setActiveTab('profile')
              setIsMobileSidebarOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'profile'
                ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => {
              setActiveTab('concepts')
              setIsMobileSidebarOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'concepts'
                ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <WrenchIcon className="w-4 h-4" />
            Concepts
          </button>
          <button
            onClick={() => {
              setActiveTab('tasks')
              setIsMobileSidebarOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'tasks'
                ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <ClockIcon className="w-4 h-4" />
            Tasks
          </button>
          <button
            onClick={() => {
              setActiveTab('deployments')
              setIsMobileSidebarOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'deployments'
                ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <SettingsIcon className="w-4 h-4" />
            Deployments
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex-1 overflow-auto bg-accent">
      <div className="w-full h-full flex">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex w-64 bg-accent border-r border-border flex-col">
          <SidebarContent />
        </div>

        {/* Mobile Sheet */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="flex flex-col max-h-full pt-10 px-3 bg-accent border-r gap-0 w-64"
          >
            <SheetTitle className="sr-only">Edit Navigation</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Navigation Bar */}
          <div className="lg:hidden bg-accent border-b border-border p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="capitalize">{activeTab}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Edit {agent.name}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-3xl">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-8"
                >
                  {activeTab === 'profile' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-semibold mb-6 text-foreground">
                          Profile Information
                        </h3>

                        {/* Name Field */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
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
                                  className="mt-2"
                                />
                              </FormControl>
                              {field.value && (
                                <div className="flex items-center gap-2 mt-3">
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
                            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
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
                                    field.value === null
                                      ? ''
                                      : field.value || ''
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
                            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
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
                        <div className="p-6 bg-card rounded-xl border border-border flex flex-col gap-6 mb-6">
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
                            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
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
                    </div>
                  )}

                  {activeTab === 'concepts' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Models & Voice
                        </h3>

                        {/* Voice Field */}
                        <FormField
                          control={form.control}
                          name="voice"
                          render={({ field }) => (
                            <FormItem className="p-4 bg-secondary rounded-lg mb-4">
                              <FormLabel>Voice (Optional)</FormLabel>
                              <FormDescription>
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
                            <FormItem className="p-4 bg-secondary rounded-lg">
                              <FormLabel>Flux LoRA Models</FormLabel>
                              <FormDescription>
                                Select models and specify when to use each one
                                (max 10 models).
                              </FormDescription>
                              <div>
                                {models.fields.map((model, index) => (
                                  <div
                                    key={model.lora}
                                    className="relative mb-4 p-4 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                                  >
                                    <div className="space-y-4">
                                      <div className="flex items-stretch gap-2 min-h-[82px]">
                                        <div className="flex-grow">
                                          <ModelMiniCard
                                            className="w-full h-full"
                                            modelId={model.lora}
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          className="hover:bg-destructive hover:text-destructive-foreground h-auto"
                                          size="icon"
                                          onClick={() => models.remove(index)}
                                        >
                                          <XIcon className="size-4" />
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
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

                                      // Check if model already exists
                                      if (
                                        models.fields.some(
                                          m => m.lora === modelId,
                                        )
                                      ) {
                                        toast.error(
                                          'This model is already added',
                                        )
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
                    </div>
                  )}
                  {activeTab === 'tasks' && <AgentTasksView agent={agent} />}
                  {activeTab === 'deployments' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">
                          Configure Deployment
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Configure your agent's deployment settings across
                          different platforms.
                        </p>

                        {deploymentsQuery.isPending && (
                          <div className="flex items-center justify-center mt-10">
                            <Loader2 className="size-4 animate-spin" />
                          </div>
                        )}

                        {deploymentsQuery.isError && (
                          <div className="flex items-center justify-center gap-2 mt-10">
                            <AlertCircle className="size-4 text-destructive" />
                            <p className="text-destructive">
                              We were unable to fetch your deployments. Please
                              try again later.
                            </p>
                          </div>
                        )}

                        {deploymentsQuery.isSuccess && (
                          <div className="space-y-4">
                            <DiscordDeploymentForm
                              agentId={agent._id}
                              deployment={deploymentsQuery.deployments?.find(
                                deployment => deployment.platform === 'discord',
                              )}
                            />
                            <TelegramDeploymentForm
                              agentId={agent._id}
                              deployment={deploymentsQuery.deployments?.find(
                                deployment =>
                                  deployment.platform === 'telegram',
                              )}
                            />
                            <TwitterDeploymentForm
                              agentId={agent._id}
                              deployment={deploymentsQuery.deployments?.find(
                                deployment => deployment.platform === 'twitter',
                              )}
                            />
                          </div>
                        )}

                        {/* Deployment Settings - Inline version to avoid form nesting */}
                        <div className="mt-8 space-y-4 rounded-lg">
                          <h2 className="text-lg font-medium">
                            Deployment Settings
                          </h2>
                          <DeploymentSettingsInline agent={agent} />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </div>

          {/* Global Update Button */}
          {activeTab !== 'deployments' && (
            <div className="border-t border-border p-6">
              <div className="mx-auto max-w-3xl lg:max-w-3xl">
                <Button
                  onClick={form.handleSubmit(handleSubmit)}
                  disabled={
                    form.formState.isSubmitting || !form.formState.isValid
                  }
                  className="w-full"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Agent...
                    </>
                  ) : !form.formState.isValid ? (
                    'Complete Required Fields'
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
  )
}
export default AgentEditView
