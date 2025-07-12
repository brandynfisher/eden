'use client'

import { ProfileImageUploader } from '../profile-image-uploader'
import ModelMiniCard from '@/components/card/model-mini-card'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { SlickUsernamePicker } from '@/components/ui/slick-username-picker'
import { Switch } from '@/components/ui/switch'
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { DiscordDeploymentForm } from '@/features/agent/deployment-sheet/discord-deployment-form'
import { FarcasterDeploymentForm } from '@/features/agent/deployment-sheet/farcaster-deployment-form'
// import { TelegramDeploymentForm } from '@/features/agent/deployment-sheet/telegram-deployment-form'
import { TwitterDeploymentForm } from '@/features/agent/deployment-sheet/twitter-deployment-form'
import { useAgentDeploymentsQuery } from '@/hooks/query/use-agent-deployments-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn, isAgentOwner } from '@/lib/utils'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  AlertCircle,
  ChevronDownIcon,
  Loader2,
  SettingsIcon,
  UserIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
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

export const EditorsList: FC<{ agent: Agent }> = ({ agent }) => {
  const [editors, setEditors] = useState<string[]>(
    agent.agent_extras?.permissions?.editors?.map(
      e => e.username || e.userId,
    ) || [],
  )
  const [newEditor, setNewEditor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddEditor = async () => {
    if (!newEditor.trim()) return

    const updatedEditors = [...editors, newEditor.trim()]
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        agent_extras: {
          permissions: {
            editors: updatedEditors,
          },
        },
      })
      setEditors(updatedEditors)
      setNewEditor('')
      toast.success('Editor added successfully', {
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ error?: string }>).response?.data?.error ||
        (error as AxiosError).message ||
        'Failed to add editor'
      toast.error('Failed to add editor', {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveEditor = async (editorToRemove: string) => {
    const updatedEditors = editors.filter(editor => editor !== editorToRemove)
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        agent_extras: {
          permissions: {
            editors: updatedEditors,
          },
        },
      })
      setEditors(updatedEditors)
      toast.success('Editor removed successfully', {
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to remove editor', {
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
      <div className="flex gap-2">
        <Input
          value={newEditor}
          onChange={e => setNewEditor(e.target.value)}
          placeholder="Enter Eden username..."
          onKeyPress={e => {
            if (e.key === 'Enter') {
              handleAddEditor()
            }
          }}
          disabled={isSubmitting}
        />
        <Button
          onClick={handleAddEditor}
          disabled={isSubmitting || !newEditor.trim()}
          type="button"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Add Editor'
          )}
        </Button>
      </div>

      {editors.length > 0 && (
        <div className="space-y-2">
          {editors.map(editor => (
            <div
              key={editor}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{editor}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveEditor(editor)}
                disabled={isSubmitting}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No editors added yet. Add editors to allow other users to modify this
          agent.
        </p>
      )}
    </div>
  )
}

type AgentFormDto = z.infer<typeof agentSchema>

const AgentEditView: FC<{
  agent: Agent
  user: unknown
}> = ({ agent }) => {
  const { user } = useAuthState()
  const searchParams = useSearchParams()
  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  // Get initial active tab from URL parameter or default to 'profile'
  const getInitialActiveTab = () => {
    const tabFromUrl = searchParams?.get('tab')
    if (
      tabFromUrl &&
      ['profile', 'concepts', 'deployments', 'permissions'].includes(tabFromUrl)
    ) {
      return tabFromUrl
    }
    return 'profile'
  }

  const [activeTab, setActiveTab] = useState(getInitialActiveTab())

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
      image:
        agent?.userImage && agent.userImage.trim()
          ? getCloudfrontOriginalUrl(agent.userImage)
          : '',
      description: agent?.description || '',
      persona: agent?.persona || '',
      isPersonaPublic: agent?.isPersonaPublic || false,
      knowledge: agent?.knowledge ?? '',
      greeting: agent?.greeting || '',
      voice: agent?.voice || '',
      models: agent?.models || [],
      tools: agent.tools || {},
    },
  })

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  // Update active tab when URL search parameters change
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab')
    if (
      tabFromUrl &&
      ['profile', 'concepts', 'deployments', 'permissions'].includes(tabFromUrl)
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
        isPersonaPublic: agent.isPersonaPublic,
        knowledge: agent.knowledge ?? '',
        greeting: agent.greeting || '',
        voice: agent.voice || '',
        models: agent.models || [],
        tools: agent.tools || {},
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

  // Get tab display name
  const getTabDisplayName = (tab: string) => {
    switch (tab) {
      case 'profile':
        return 'Profile'
      case 'concepts':
        return 'Tools'
      case 'deployments':
        return 'Deployments'
      case 'permissions':
        return 'Permissions'
      default:
        return 'Profile'
    }
  }

  // Get available tabs
  const getAvailableTabs = () => {
    const tabs = [
      { key: 'profile', label: 'Profile', icon: UserIcon },
      { key: 'concepts', label: 'Tools', icon: WrenchIcon },
    ]

    if (isAgentOwner(agent, user?._id) && isPreviewUser) {
      tabs.push(
        { key: 'deployments', label: 'Deployments', icon: SettingsIcon },
        { key: 'permissions', label: 'Permissions', icon: UserIcon },
      )
    }

    return tabs
  }

  // Top tabs content component
  const TopTabsContent = () => {
    const availableTabs = getAvailableTabs()

    return (
      <div className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="px-6">
          {/* Desktop tabs */}
          <div className="hidden sm:flex space-x-8 overflow-x-auto">
            {availableTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile dropdown */}
          <div className="sm:hidden py-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="sm"
                >
                  {getTabDisplayName(activeTab)}
                  <ChevronDownIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full" align="start">
                {availableTabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <DropdownMenuItem
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-2',
                        activeTab === tab.key && 'bg-accent',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-accent flex flex-col h-full">
      <TopTabsContent />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <div>
                      {/* Combined Profile Section */}
                      <div className="p-6 bg-card rounded-xl border border-border mb-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Profile Image */}
                          <div className="flex-shrink-0">
                            <FormField
                              control={form.control}
                              name="image"
                              render={({ field }) => (
                                <FormItem>
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
                                  <ProfileImageUploader
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Username and Display Name */}
                          <div className="flex-1 space-y-4">
                            {/* Username Field */}
                            <FormField
                              control={form.control}
                              name="key"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-medium">
                                    Username
                                    <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <SlickUsernamePicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      displayName={form.watch('name')}
                                      onBlur={field.onBlur}
                                      disabled={form.formState.isSubmitting}
                                      originalValue={agent.username}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Display Name Field */}
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-medium">
                                    Name
                                    <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      placeholder="Display name"
                                      {...field}
                                      onChange={e => {
                                        field.onChange(
                                          e.target.value.slice(0, 42),
                                        )
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

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
                            <FormControl>
                              <AutosizeTextarea
                                placeholder="Short description of the agent shown on profile and cards."
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
                                Instructions
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <AutosizeTextarea
                                  placeholder="Describe your agent's persona, traits, goals, backstory, rules, and other such details."
                                  {...field}
                                  className="min-h-[240px]"
                                  variant="xl"
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
                      </div>

                      {/* Greeting Field */}
                      <FormField
                        control={form.control}
                        name="greeting"
                        render={({ field }) => (
                          <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
                            <FormLabel className="text-base font-medium">
                              Greeting
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
                      {/* Voice Field */}
                      <FormField
                        control={form.control}
                        name="voice"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-secondary rounded-lg mb-4">
                            <FormLabel>Voice</FormLabel>
                            <FormDescription>
                              Your agent will speak with this voice.
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
                            <FormLabel>Custom Models</FormLabel>
                            <FormDescription>
                              Give your agent a unique aesthetic using up to 10
                              custom models.
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

                      {/* Tools Field */}
                      <FormField
                        control={form.control}
                        name="tools"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-secondary rounded-lg mt-4">
                            <FormLabel>Tools</FormLabel>
                            <FormDescription>
                              Select which tools this agent can use to help
                              users.
                            </FormDescription>
                            <FormControl>
                              <div className="space-y-3">
                                {[
                                  {
                                    key: 'create_image',
                                    label: 'Create images',
                                  },
                                  {
                                    key: 'create_video',
                                    label: 'Create Video',
                                  },
                                  {
                                    key: 'create_audio',
                                    label:
                                      'Create Audio (including music and speech)',
                                  },
                                  {
                                    key: 'vj_tools',
                                    label:
                                      'VJ Tools (Texture Flow and Video FX)',
                                  },
                                  {
                                    key: 'news',
                                    label: 'Read the news',
                                  },
                                  {
                                    key: 'social_media_tools',
                                    label: 'Social media tools (read and post)',
                                  },
                                  {
                                    key: 'legacy_tools',
                                    label: 'Legacy tools',
                                    description: '2023 Eden tools',
                                  },
                                  {
                                    key: 'all_tools',
                                    label: 'All individual tools',
                                    description:
                                      'Make available individual tools inside the image, video, and audio multi-tools (50+ individual tools)',
                                  },
                                ].map(tool => (
                                  <div
                                    key={tool.key}
                                    className="flex items-center space-x-2"
                                  >
                                    <Switch
                                      checked={Boolean(field.value?.[tool.key])}
                                      onCheckedChange={checked => {
                                        const currentTools = field.value || {}
                                        field.onChange({
                                          ...currentTools,
                                          [tool.key]: checked,
                                        })
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <label className="text-sm font-medium">
                                        {tool.label}
                                      </label>
                                      {tool.description && (
                                        <span className="text-xs text-muted-foreground">
                                          {tool.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'deployments' &&
                  isAgentOwner(agent, user?._id) &&
                  isPreviewUser && (
                    <div className="space-y-6">
                      <div>
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
                            {/* <TelegramDeploymentForm
                                agentId={agent._id}
                                deployment={deploymentsQuery.deployments?.find(
                                  deployment =>
                                    deployment.platform === 'telegram',
                                )}
                              /> */}
                            <TwitterDeploymentForm
                              agentId={agent._id}
                              deployment={deploymentsQuery.deployments?.find(
                                deployment => deployment.platform === 'twitter',
                              )}
                            />
                            <FarcasterDeploymentForm
                              agentId={agent._id}
                              deployment={deploymentsQuery.deployments?.find(
                                deployment =>
                                  deployment.platform === 'farcaster',
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
                {activeTab === 'permissions' &&
                  isAgentOwner(agent, user?._id) &&
                  isPreviewUser && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-medium mb-4">
                          Agent Permissions
                        </h2>
                        <div className="p-6 bg-card rounded-xl border border-border">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium block mb-2">
                                Editors
                              </label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Users who can edit this agent (in addition to
                                the owner)
                              </p>
                              <EditorsList agent={agent} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </form>
            </Form>

            {/* Global Update Button */}
            {activeTab !== 'deployments' &&
              activeTab !== 'tasks' &&
              activeTab !== 'permissions' && (
                <div className="border-t border-border p-6">
                  <div className="mx-auto max-w-4xl">
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
