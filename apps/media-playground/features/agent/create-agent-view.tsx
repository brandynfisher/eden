'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import GatedPrivacySwitch from '@/components/form/gated-privacy-switch'
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
import { SlickUsernamePicker } from '@/components/ui/slick-username-picker'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { ProfileImageUploader } from '@/features/sessions/profile-image-uploader'
import {
  AGENT_FIELD_GUIDANCE,
  AGENT_FIELD_LIMITS,
} from '@/features/sessions/views/agent-constants'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="text-xs text-muted-foreground text-right">
      {current}/{max}
    </div>
  )
}

const CreateAgentView = () => {
  const router = useRouter()

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      key: '',
      image: '',
      description: '',
      persona: '',
      public: true,
      knowledge: '',
      greeting: '',
      voice: '',
      models: [],
      suggestions: [],
      tools: {
        create_image: true,
        create_video: true,
        create_audio: false,
        vj_tools: false,
        manage_collections: false,
        social_media_tools: false,
      },
      llm_settings: {
        model_profile: 'medium',
        thinking_policy: 'auto',
        thinking_effort_cap: 'medium',
        thinking_effort_instructions: '',
      },
    },
  })

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  const handleSubmit = async (data: AgentFormDto) => {
    try {
      const response = await axios.post('/api/agents', data)
      const createdAgent = response.data?.agent || data

      toast.success('Agent created successfully', {
        description: `"${data.name}" has been created successfully`,
        richColors: true,
        dismissible: true,
      })

      const chatTarget = createdAgent.username || createdAgent.key
      if (chatTarget) {
        router.push(`/chat/${chatTarget}`)
      }
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
        (error as AxiosError).message ||
        'Please try again later.'
      const description =
        errorMessage === 'An agent with this key already exists'
          ? 'This username is taken. Please try another.'
          : errorMessage

      toast.error('Agent creation failed', {
        description,
        richColors: true,
        dismissible: true,
      })
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Create a new agent
        </h1>
      </div>

      <div className="flex-1">
        <Form {...form}>
          <form
            className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 pb-12"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="lg:min-w-[220px]">
                  <div className="mt-3 flex flex-col items-center gap-3">
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              className="hidden"
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              value={
                                field.value === null ? '' : field.value || ''
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
                </div>

                <div className="flex-1 space-y-4">
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
                              field.onChange(e.target.value.slice(0, 42))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            autoGenerateOnDisplayNameChange={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="public"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <FormLabel className="text-base font-medium">
                      Make Agent Public
                    </FormLabel>
                    <FormDescription>
                      Allow other Eden users to discover and chat with this
                      agent.
                    </FormDescription>
                  </div>
                  <FormControl className="flex justify-end">
                    <GatedPrivacySwitch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                      entityLabel="agents"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="rounded-xl border border-border bg-card p-6">
                  <FormLabel className="text-base font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            Description
                            <span className="text-red-500 ml-1">*</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {AGENT_FIELD_GUIDANCE.DESCRIPTION}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                      max={AGENT_FIELD_LIMITS.DESCRIPTION_MAX_CHARS}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="persona"
              render={({ field }) => (
                <FormItem className="rounded-xl border border-border bg-card p-6">
                  <FormLabel className="text-base font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            Instructions
                            <span className="text-red-500 ml-1">*</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs whitespace-pre-wrap">
                            {AGENT_FIELD_GUIDANCE.INSTRUCTIONS}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                      max={AGENT_FIELD_LIMITS.INSTRUCTIONS_MAX_CHARS}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="greeting"
              render={({ field }) => (
                <FormItem className="rounded-xl border border-border bg-card p-6">
                  <FormLabel className="text-base font-medium">
                    Greeting
                  </FormLabel>
                  <FormDescription className="mt-1 mb-3">
                    This will be displayed to users when they first interact
                    with the agent.
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

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Capabilities & tools
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Control which LoRA models, voices, and creation tools this
                    agent can access.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="models"
                  render={() => (
                    <FormItem className="space-y-4 rounded-lg border border-border/60 bg-secondary/40 p-4">
                      <FormLabel>Custom Models</FormLabel>
                      <FormDescription>
                        Give your agent a unique aesthetic using up to 10 custom
                        models.
                      </FormDescription>
                      <div>
                        {models.fields.map((model, index) => (
                          <div
                            key={model.lora}
                            className="relative mb-4 rounded-lg border border-border/50 bg-background p-4 transition-colors hover:border-primary/50"
                          >
                            <div className="space-y-4">
                              <div className="flex items-stretch gap-2 min-h-[82px]">
                                <div className="flex-grow">
                                  <ModelMiniCard
                                    className="h-full w-full"
                                    modelId={model.lora}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto hover:bg-destructive hover:text-destructive-foreground"
                                  size="icon"
                                  onClick={() => models.remove(index)}
                                >
                                  <XIcon className="size-4" />
                                </Button>
                              </div>
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
                                        placeholder='e.g., "use for realistic portraits"'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                        <ModelSelectorModal
                          className="w-full p-4 md:p-8"
                          title="Select LoRA Model"
                          description="Pick a LoRA model to add to this agent"
                          currentValue=""
                          selectedIds={models.fields.map(m => m.lora)}
                          onChange={id => {
                            const modelId = typeof id === 'string' ? id : id[0]
                            if (!modelId) return
                            if (models.fields.some(m => m.lora === modelId)) {
                              toast.error('This model is already added')
                              return
                            }
                            form.setValue('models', [
                              ...models.fields,
                              { lora: modelId, use_when: '' },
                            ])
                          }}
                          trigger={
                            <Button
                              type="button"
                              disabled={models.fields.length >= 10}
                              className="w-full"
                            >
                              Add LoRA Model
                            </Button>
                          }
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voice"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-border/60 bg-secondary/40 p-4">
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

                <FormField
                  control={form.control}
                  name="tools"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                      <FormLabel>Tools</FormLabel>
                      <FormDescription>
                        Select which tools this agent can use to help users.
                      </FormDescription>
                      <FormControl>
                        <div className="space-y-3">
                          {[
                            {
                              key: 'create_image',
                              label: 'Create images and videos',
                            },
                            {
                              key: 'create_audio',
                              label:
                                'Create Audio (including music and speech)',
                            },
                            {
                              key: 'vj_tools',
                              label: 'VJ Tools (Texture Flow and Video FX)',
                            },
                            {
                              key: 'manage_collections',
                              label: 'Manage collections',
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
                              <label className="text-sm font-medium">
                                {tool.label}
                              </label>
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

            <div className="border-t border-dashed border-border pt-6">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  'Create Agent'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default CreateAgentView
