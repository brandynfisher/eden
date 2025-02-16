'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import FileUploader from '@/components/media/file-uploader'
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
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAgentFormSheet } from '@/stores/dialogs/dialogs.selector'
import { updateAgentFormSheet } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { slugifyName } from '@/utils/slug.util'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { AlertCircle, Edit2Icon, Loader2, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
  model: z.string().optional(),
  persona: z.string().max(30000).optional(),
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

  const dispatch = useAppDispatch()
  const agentQuery = useAgentQuery({
    key: agentId || '',
    enabled: isOpen,
    refetchOnWindowFocus: false,
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
      knowledge: agentQuery.agent?.knowledge ?? '',
      greeting: agentQuery.agent?.greeting || '',
      model: agentQuery.agent?.model || '',
      suggestions: agentQuery.agent?.suggestions || [],
    },
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
        knowledge: agentQuery.agent.knowledge ?? '',
        greeting: agentQuery.agent.greeting || '',
        model: agentQuery.agent.model || '',
        suggestions: agentQuery.agent.suggestions,
      })
    } else {
      form.reset({
        name: '',
        key: '',
        image: '',
        description: '',
        persona: '',
        knowledge: '',
        greeting: '',
        model: '',
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
        await axios.post('/api/agents', data)
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
        model: '',
      })
    }
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
        {agentQuery.isPending && (
          <div className="flex items-center justify-center mt-10">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {agentQuery.isError && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-destructive">
              We were unable to fetch agent. Please try again later.
            </p>
          </div>
        )}
        {agentQuery.isSuccess && (
          <Form {...form}>
            <form
              className="w-full space-y-4 py-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/** Name Field with Key */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg">
                    <FormLabel>Display Name*</FormLabel>
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
                              <span>Auto generated unique name: {key}</span>
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
                        Friendly Name of your agent. This will be displayed to
                        users.
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

              {/** Image Field */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg">
                    <FormLabel>Profile Image</FormLabel>
                    <FormControl>
                      <Input
                        className={'hidden'}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value === null ? '' : field.value || ''}
                      />
                    </FormControl>
                    <FileUploader
                      value={field.value === null ? [] : field.value || []}
                      onChange={field.onChange}
                      allowedFileTypes={['image']}
                      maxFiles={1}
                      allowMultiple={false}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/** Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg">
                    <FormLabel>Description*</FormLabel>
                    <FormDescription>
                      Short description of the agent shown on profile and cards.
                    </FormDescription>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="This agent helps you with your tasks"
                        {...field}
                      />
                    </FormControl>
                    <CharacterCount
                      current={field.value?.length || 0}
                      max={5000}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/** Persona Field */}
              <FormField
                control={form.control}
                name="persona"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg">
                    <FormLabel>Persona*</FormLabel>
                    <FormDescription>
                      Personality and behaviour of the agent. This won't be
                      visible to others.
                    </FormDescription>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="You are a helpful agent, always ready to help users with their tasks"
                        {...field}
                      />
                    </FormControl>
                    <CharacterCount
                      current={field.value?.length || 0}
                      max={30000}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/** Greeting Field */}
              <FormField
                control={form.control}
                name="greeting"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg">
                    <FormLabel>Greeting*</FormLabel>
                    <FormDescription>
                      This will be displayed to users when they first interact
                      with the agent.
                    </FormDescription>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Hello, how can I help you today?"
                        {...field}
                      />
                    </FormControl>
                    <CharacterCount
                      current={field.value?.length || 0}
                      max={140}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/** Knowledge Field */}
              {/* //@todo: TODO: Add knowledge field back in, currently hidden due to no use */}
              <FormField
                control={form.control}
                name="knowledge"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg hidden">
                    <FormLabel>Knowledge</FormLabel>
                    <FormDescription>
                      Additional knowledge or context for the agent.
                    </FormDescription>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Add any specific knowledge or context for the agent..."
                        {...field}
                      />
                    </FormControl>
                    <CharacterCount
                      current={field.value?.length ?? 0}
                      max={100000}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/** Model Field */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem className="p-2 bg-secondary rounded-lg">
                    <FormLabel>Flux LoRa (Optional)</FormLabel>
                    <div>
                      {field.value && (
                        <div className="relative mb-2">
                          <ModelMiniCard modelId={field.value}>
                            <Button
                              type="button"
                              variant="ghost"
                              className="absolute h-[calc(100%-16px)] top-2 right-2 hover:bg-destructive hover:text-destructive-foreground"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation()
                                field.onChange('')
                              }}
                            >
                              <XIcon className="size-4" />
                            </Button>
                          </ModelMiniCard>
                        </div>
                      )}
                      <ModelSelectorModal
                        className="p-4 md:p-8 w-full"
                        title="Select Flux LoRa"
                        description="Pick a Flux LoRa to use as a default model for this agent"
                        base_model="flux-dev"
                        currentValue={field.value || ''}
                        onChange={field.onChange}
                        trigger={
                          <Button type="button" variant="outline">
                            {field.value
                              ? 'Change Flux LoRa'
                              : 'Select Flux LoRa'}
                          </Button>
                        }
                      />
                    </div>
                  </FormItem>
                )}
              />

              <SheetFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {mode === 'update' ? 'Update Agent' : 'Create Agent'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default AgentFormSheet
