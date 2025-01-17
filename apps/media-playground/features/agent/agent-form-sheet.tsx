'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import FileUploader from '@/components/media/file-uploader'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useToolsListQuery } from '@/hooks/query/use-tools-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { slugifyName } from '@/utils/slug.util'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Edit2Icon, PlusIcon, XIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const DEFAULT_TOOL_KEYS = ['flux_dev_lora']

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
  description: z.string().min(1).max(10000),
  instructions: z.string().min(1).max(10000),
  discordId: z.string().optional(),
  modelId: z.string().optional(),
  tools: z.string().optional(),
})

type AgentFormDto = z.infer<typeof agentSchema>

type AgentSheetProps = {
  mode: 'create' | 'update'
  agent?: Agent
  onAction: () => Promise<void>
}

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="ml-auto text-xs text-muted-foreground flex-shrink-0 text-right">
      {current}/{max} chars
    </div>
  )
}

function groupToolsByOutputType(
  tools: Array<{ key: string; name: string; output_type: string }>,
) {
  return tools?.reduce((acc, tool) => {
    const group = tool.output_type || 'Other'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push({
      key: tool.key,
      label: tool.name,
    })
    return acc
  }, {} as Record<string, Array<{ key: string; label: string }>>)
}

const AgentFormSheet = ({ mode, agent, onAction }: AgentSheetProps) => {
  const { tools } = useToolsListQuery()
  const AVAILABLE_TOOLS = tools?.map(tool => ({
    label: tool.name,
    key: tool.key,
  }))
  const { user } = useAuthState()
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasEditParam = searchParams.get('edit')
  const hasCreateParam = searchParams.get('create')
  const [isOpen, setIsOpen] = useState(
    hasEditParam !== null
      ? hasEditParam === 'true'
      : false || hasCreateParam !== null
      ? hasCreateParam === 'true'
      : false,
  )
  const [isManualKeyEdit, setIsManualKeyEdit] = useState(false)
  const isUpdateMode = hasEditParam || mode === 'update'

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: isUpdateMode
      ? {
          name: agent?.name,
          key: agent?.username || '',
          image: agent?.userImage,
          description: agent?.description,
          instructions: agent?.instructions,
          discordId: agent?.discordId ?? '',
          modelId: agent?.model ?? '',
          // tools: agent?.tools as unknown as string ?? '',
        }
      : {
          name: '',
          key: '',
          description: '',
          instructions: '',
          // discordId: '',
          // modelId: '',
          // tools: '',
        },
  })

  const name = form.watch('name')

  useEffect(() => {
    if (!isManualKeyEdit && name && !isUpdateMode) {
      form.setValue('key', slugifyName(name))
    }
  }, [form, name, isManualKeyEdit, isUpdateMode])

  const handleSubmit = async (data: AgentFormDto) => {
    try {
      if (isUpdateMode) {
        await axios.patch(`/api/agents/${agent?._id}`, data)
        toast.success('Agent updated successfully', {
          description: `"${data.name}" has been updated successfully`,
          richColors: true,
          dismissible: true,
        })
      } else {
        await axios.post('/api/agents', data)
        toast.success('Agent created successfully', {
          description: `"${data.name}" has been created successfully`,
          richColors: true,
          dismissible: true,
        })
      }
      onOpenChange(false)
      await onAction()
    } catch (error) {
      toast.error(
        `${isUpdateMode ? 'Agent update' : 'Agent creation'} failed`,
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

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if ((hasCreateParam || hasEditParam) && !open) {
      if (agent) {
        router.replace(`/agents/${agent?.username}`)
      } else {
        router.replace(`/creators/${user?.username}?tab=agents`)
      }
    }
    // form.reset()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size={isUpdateMode ? 'icon' : 'default'}
          className={isUpdateMode ? '' : 'gap-x-2'}
        >
          {isUpdateMode ? (
            <Edit2Icon size={18} />
          ) : (
            <>
              <PlusIcon className="size-4" />
              <div className="text-sm font-semibold">Create Agent</div>
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isUpdateMode ? 'Update Agent' : 'Create an Agent'}
          </SheetTitle>
          <SheetDescription>
            {isUpdateMode
              ? 'Update your agent'
              : 'Create an agent to help you with your tasks.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="w-full space-y-4 py-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {/** Name Field */}
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
                  <div className="flex gap-2 flex-wrap">
                    {!isUpdateMode && (
                      <FormDescription>
                        Friendly Name of your agent. This will be displayed to
                        users.
                      </FormDescription>
                    )}
                    <CharacterCount
                      current={field.value?.length || 0}
                      max={42}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/** Key Field */}
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <FormLabel>Name*</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setIsManualKeyEdit(!isManualKeyEdit)}
                    >
                      {isManualKeyEdit ? 'Auto Generate' : 'Manual Edit'}
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="helpful-agent-1"
                      {...field}
                      onChange={e => {
                        if (isManualKeyEdit) {
                          const value = e.target.value
                            .toLowerCase()
                            .slice(0, 42)
                          field.onChange(value)
                        } else {
                          field.onChange(e.target.value)
                        }
                      }}
                      onBlur={e => {
                        if (isManualKeyEdit) {
                          field.onChange(
                            slugifyName(e.target.value.slice(0, 42)),
                          )
                        }
                        field.onBlur()
                      }}
                      readOnly={!isManualKeyEdit}
                      className={!isManualKeyEdit ? 'bg-accent' : ''}
                      disabled={!isManualKeyEdit}
                    />
                  </FormControl>
                  <div className="flex gap-2 flex-wrap">
                    <FormDescription>
                      {isManualKeyEdit ? (
                        <>
                          Enter a unique name for your agent.
                          <span className="block mt-1 text-xs text-muted-foreground">
                            Lowercase letters, numbers, and dashes only.
                          </span>
                        </>
                      ) : (
                        <>
                          Unique name of your agent. Auto-generated from display
                          name
                        </>
                      )}
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
                  <FormControl>
                    <AutosizeTextarea
                      placeholder="Abraham is a helpful agent"
                      {...field}
                    />
                  </FormControl>
                  <CharacterCount
                    current={field.value?.length || 0}
                    max={20000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/** Instructions Field */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Instructions*</FormLabel>
                  <FormControl>
                    <AutosizeTextarea
                      placeholder="Instruct your agent how to act"
                      {...field}
                    />
                  </FormControl>
                  <CharacterCount
                    current={field.value?.length || 0}
                    max={20000}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/** Model Field */}
            <FormField
              control={form.control}
              name="modelId"
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

            {/** Discord ID Field */}
            <FormField
              control={form.control}
              name="discordId"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Discord ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter the Discord ID of your agent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/** Tools Field */}
            <FormField
              control={form.control}
              name="tools"
              render={({ field }) => {
                const selectedTools = field.value
                  ? field.value.split(',')
                  : DEFAULT_TOOL_KEYS
                const groupedTools = groupToolsByOutputType(tools || [])

                const handleSelectAll = () => {
                  field.onChange(AVAILABLE_TOOLS?.map(t => t.key).join(','))
                }

                const handleSelectNone = () => {
                  field.onChange('')
                }

                const handleResetToDefault = () => {
                  field.onChange(DEFAULT_TOOL_KEYS.join(','))
                }

                return (
                  <Collapsible
                    defaultOpen={false}
                    className="p-2 bg-secondary rounded-lg space-y-2 hidden" //@TODO: temporarily hidden
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger className="hover:opacity-80">
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <FormLabel className="hover:cursor-pointer">
                          Tools{' '}
                          <span className="text-xs text-muted-foreground">
                            ({selectedTools.length}/{AVAILABLE_TOOLS?.length})
                          </span>
                        </FormLabel>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={handleSelectAll}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={handleSelectNone}
                        >
                          Select None
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={handleResetToDefault}
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent className="space-y-4">
                      <FormDescription>
                        Configure which tools this agent can use.
                      </FormDescription>

                      {Object.entries(groupedTools).map(
                        ([groupName, groupTools]) => (
                          <Collapsible
                            key={groupName}
                            defaultOpen={false}
                            className="space-y-2"
                          >
                            <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80">
                              <ChevronDown className="h-4 w-4" />
                              <div className="flex justify-between w-full">
                                <span className="text-sm font-medium">
                                  {groupName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (
                                  {
                                    groupTools.filter(t =>
                                      selectedTools.includes(t.key),
                                    ).length
                                  }
                                  /{groupTools.length})
                                </span>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="space-y-2 pl-6">
                              {groupTools.map(tool => (
                                <div
                                  key={tool.key}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={tool.key}
                                    checked={selectedTools.includes(tool.key)}
                                    onCheckedChange={checked => {
                                      const updatedTools = checked
                                        ? [...selectedTools, tool.key]
                                        : selectedTools.filter(
                                            t => t !== tool.key,
                                          )
                                      field.onChange(updatedTools.join(','))
                                    }}
                                  />
                                  <label
                                    htmlFor={tool.key}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {tool.label}
                                  </label>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ),
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )
              }}
            />

            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isUpdateMode ? 'Update Agent' : 'Create Agent'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default AgentFormSheet
