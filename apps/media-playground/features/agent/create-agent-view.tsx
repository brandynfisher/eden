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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { ProfileImageUploader } from '@/features/chat/components/profile-image-uploader'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import {
  ChevronRightIcon,
  Loader2,
  SettingsIcon,
  UserIcon,
  WrenchIcon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Agent form schema
const agentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(42),
  key: z.string().min(1, 'Key is required'),
  image: z.string().optional(),
  description: z.string().min(1, 'Description is required').max(5000),
  persona: z.string().min(1, 'Persona is required').max(30000),
  isPersonaPublic: z.boolean().default(false),
  knowledge: z.string().optional(),
  greeting: z.string().max(140).optional(),
  voice: z.string().optional(),
  models: z
    .array(
      z.object({
        lora: z.string(),
        use_when: z.string().trim().max(500).min(1),
      }),
    )
    .max(10)
    .default([]),
  suggestions: z.array(z.string()).default([]),
  tools: z.object({}).passthrough().default({
    create_image: true,
    create_video: true,
    create_audio: true,
    vj_tools: false,
    news: false,
    social_media_tools: false,
  }),
})

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
  const [activeTab, setActiveTab] = useState('profile')
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
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
      tools: {
        create_image: true,
        create_video: true,
        create_audio: true,
        vj_tools: false,
        news: false,
        social_media_tools: false,
      },
    },
  })

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  const handleSubmit = async (data: AgentFormDto) => {
    try {
      await axios.post('/api/agents', data)
      router.push(`/chat/${data.key}`)
      toast.success('Agent created successfully', {
        description: `"${data.name}" has been created successfully`,
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

      toast.error('Agent creation failed', {
        description,
        richColors: true,
        dismissible: true,
      })
    }
  }

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Create New Agent</h2>
        <p className="text-sm text-muted-foreground">Configure your agent</p>
      </div>
      <div className="flex-1 p-2">
        <div className="space-y-1">
          <button
            onClick={() => {
              setActiveTab('profile')
              setIsMobileSheetOpen(false)
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
              setIsMobileSheetOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'concepts'
                ? 'bg-primary/40 hover:bg-primary/20 border-primary/60 hover:border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <WrenchIcon className="w-4 h-4" />
            Tools
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div
      className="
     flex flex-col
     fixed
     inset-x-0
     bottom-0
     top-16
   "
    >
      <div className="flex-1 overflow-auto bg-accent">
        <div className="w-full h-full flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex w-64 bg-accent border-r border-border flex-col">
            <SidebarContent />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden bg-accent border-b border-border p-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsMobileSheetOpen(true)}
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="capitalize">{activeTab}</span>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
              <div className="text-sm text-muted-foreground">
                Create New Agent
              </div>
            </div>

            {/* Mobile Navigation Sheet */}
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetContent side="left" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Create New Agent</SheetTitle>
                  <SheetDescription>
                    Configure your agent by selecting a section below
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-colors',
                      activeTab === 'profile'
                        ? 'bg-primary/40 border-primary/60'
                        : 'bg-card border-border hover:bg-accent',
                    )}
                    onClick={() => {
                      setActiveTab('profile')
                      setIsMobileSheetOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <UserIcon className="w-5 h-5" />
                      <h3 className="font-medium">Profile</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set up your agent's basic information, including name,
                      description, persona, and greeting message.
                    </p>
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-colors',
                      activeTab === 'concepts'
                        ? 'bg-primary/40 border-primary/60'
                        : 'bg-card border-border hover:bg-accent',
                    )}
                    onClick={() => {
                      setActiveTab('concepts')
                      setIsMobileSheetOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <WrenchIcon className="w-5 h-5" />
                      <h3 className="font-medium">Tools</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure your agent's voice, AI models, and tools.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Scrollable form content */}
            <div className="flex-1 overflow-auto">
              <div className="mx-auto max-w-3xl pt-6">
                <Form {...form}>
                  <form
                    className="w-full space-y-4"
                    onSubmit={form.handleSubmit(handleSubmit)}
                  >
                    {activeTab === 'profile' && (
                      <div className="space-y-6">
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
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        placeholder="Username on Eden"
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

                              {/* Display Name Field */}
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base font-medium">
                                      Name
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
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
                            <FormItem className="p-4 bg-card rounded-xl border border-border">
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
                        <div className="p-4 bg-card rounded-xl border border-border flex flex-col gap-4">
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
                            <FormItem className="p-4 bg-card rounded-xl border border-border">
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

                          {/* Models Field (matching agent edit view) */}
                          <FormField
                            control={form.control}
                            name="models"
                            render={() => (
                              <FormItem className="p-4 bg-secondary rounded-lg">
                                <FormLabel>Custom Models</FormLabel>
                                <FormDescription>
                                  Give your agent a unique aesthetic using up to
                                  10 custom models.
                                </FormDescription>
                                <div>
                                  {models.fields.map((model, index) => (
                                    <div
                                      key={model.id || model.lora}
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
                                                  <span className="text-red-500 ml-1">
                                                    *
                                                  </span>
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
                                      selectedIds={models.fields.map(
                                        m => m.lora,
                                      )}
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
                                        models.append({
                                          lora: modelId,
                                          use_when: '',
                                        })
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
                                <FormMessage />
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
                                        label:
                                          'Social media tools (read and post)',
                                      },
                                    ].map(tool => (
                                      <div
                                        key={tool.key}
                                        className="flex items-center space-x-2"
                                      >
                                        <Switch
                                          checked={Boolean(
                                            field.value?.[tool.key],
                                          )}
                                          onCheckedChange={checked => {
                                            const currentTools =
                                              field.value || {}
                                            field.onChange({
                                              ...currentTools,
                                              [tool.key]: checked,
                                            })
                                          }}
                                          className="data-[state=unchecked]:bg-zinc-800"
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
                    )}
                  </form>
                </Form>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-border p-6 ">
              <div className="mx-auto max-w-3xl lg:max-w-3xl">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                  onClick={form.handleSubmit(handleSubmit)}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateAgentView
