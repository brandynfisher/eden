'use client'

import {
  MEMORY_ERROR_MESSAGES,
  MEMORY_LIMITS,
  MEMORY_UI_MESSAGES,
} from './memory-constants'
import MemoryEditConfirmationDialog from './memory-edit-confirmation-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const memorySchema = z.object({
  content: z
    .string()
    .max(
      MEMORY_LIMITS.MEMORY_CONTENT_MAX_CHARS,
      MEMORY_ERROR_MESSAGES.MEMORY_CONTENT_MAX_CHARS,
    )
    .optional(),
  extraction_prompt: z
    .string()
    .min(
      MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS,
      MEMORY_ERROR_MESSAGES.EXTRACTION_PROMPT_MIN_CHARS,
    )
    .max(
      MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS,
      MEMORY_ERROR_MESSAGES.EXTRACTION_PROMPT_MAX_CHARS,
    )
    .optional(),
  is_active: z.boolean().optional(),
})

const newGuideSchema = z.object({
  guide_name: z
    .string()
    .min(
      MEMORY_LIMITS.SHARD_NAME_MIN_CHARS,
      MEMORY_ERROR_MESSAGES.SHARD_NAME_MIN_CHARS,
    )
    .max(
      MEMORY_LIMITS.SHARD_NAME_MAX_CHARS,
      MEMORY_ERROR_MESSAGES.SHARD_NAME_MAX_CHARS,
    ),
  extraction_prompt: z
    .string()
    .min(
      MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS,
      MEMORY_ERROR_MESSAGES.EXTRACTION_PROMPT_MIN_CHARS,
    )
    .max(
      MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS,
      MEMORY_ERROR_MESSAGES.EXTRACTION_PROMPT_MAX_CHARS,
    ),
})

type MemoryFormDto = z.infer<typeof memorySchema>
type NewGuideFormDto = z.infer<typeof newGuideSchema>

interface MemorySession {
  _id: string
  content: string
  createdAt?: string
  updatedAt?: string
}

interface CollectiveGuide {
  _id: string
  agent_id: string
  content?: string
  extraction_prompt?: string
  is_active?: boolean
  facts: MemorySession[]
  unabsorbed_memory_ids: MemorySession[]
}

interface CollectiveMemoryProps {
  agent: Agent
  hasAccess: boolean
  needsPreview?: boolean
  onTabChange?: (tab: 'user' | 'collective') => void
  showTabToggle?: boolean
}

// Helper function to calculate age in days
const calculateAgeInDays = (updatedAt?: string): number => {
  if (!updatedAt) return 0
  const now = new Date()
  const updated = new Date(updatedAt)
  const diffTime = Math.abs(now.getTime() - updated.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper function to extract error message from axios error
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data
    if (responseData?.message) {
      return responseData.message
    } else if (responseData?.error) {
      return responseData.error
    }

    // Handle common status codes
    switch (error.response?.status) {
      case 404:
        return 'Resource not found'
      case 401:
        return 'You are not authorized to perform this action'
      case 403:
        return 'You do not have permission to perform this action'
      case 400:
        return 'Invalid request data'
      default:
        return fallback
    }
  }
  return fallback
}

const CollectiveMemory: FC<CollectiveMemoryProps> = ({
  agent,
  hasAccess,
  needsPreview = false,
  onTabChange,
  showTabToggle = false,
}) => {
  const [guides, setGuides] = useState<CollectiveGuide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<
    'content' | 'extraction_prompt' | null
  >(null)
  const [editingGuide, setEditingGuide] = useState<CollectiveGuide | null>(null)
  const [isMemoryEditModalOpen, setIsMemoryEditModalOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<MemorySession | null>(null)
  const [isNewGuideModalOpen, setIsNewGuideModalOpen] = useState(false)
  const [isMemoryConfirmationOpen, setIsMemoryConfirmationOpen] =
    useState(false)
  const [pendingMemoryData, setPendingMemoryData] = useState<{
    content: string
  } | null>(null)
  const [isContentEditModalOpen, setIsContentEditModalOpen] = useState(false)
  const [pendingContentData, setPendingContentData] = useState<{
    content: string
  } | null>(null)
  const [isContentConfirmationOpen, setIsContentConfirmationOpen] =
    useState(false)

  const form = useForm<MemoryFormDto>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      content: '',
      extraction_prompt: '',
      is_active: false,
    },
  })

  const memoryForm = useForm<{ content: string }>({
    resolver: zodResolver(
      z.object({
        content: z
          .string()
          .max(
            MEMORY_LIMITS.FACTS_MAX_CHARS,
            MEMORY_ERROR_MESSAGES.FACTS_MAX_CHARS,
          ),
      }),
    ),
    defaultValues: { content: '' },
  })

  const contentForm = useForm<{ content: string }>({
    resolver: zodResolver(
      z.object({
        content: z
          .string()
          .max(
            MEMORY_LIMITS.MEMORY_CONTENT_MAX_CHARS,
            MEMORY_ERROR_MESSAGES.MEMORY_CONTENT_MAX_CHARS,
          ),
      }),
    ),
    defaultValues: { content: '' },
  })

  const newGuideForm = useForm<NewGuideFormDto>({
    resolver: zodResolver(newGuideSchema),
    defaultValues: {
      guide_name: '',
      extraction_prompt: '',
    },
  })

  useEffect(() => {
    const loadCollectiveMemory = async () => {
      if (!agent || !hasAccess) {
        setIsLoading(false)
        return
      }

      try {
        const response = await axios.get(
          `/api/agents/${agent._id}/collective-memory`,
        )
        setGuides(response.data.shards || [])
      } catch (error) {
        console.error('Error loading collective memory:', error)
        setGuides([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCollectiveMemory()
  }, [agent?._id, hasAccess])

  const handleFieldEdit = (
    guide: CollectiveGuide,
    field: 'content' | 'extraction_prompt',
  ) => {
    setEditingGuide(guide)
    setEditingField(field)
    form.setValue(field, guide[field] || '')
    setIsEditModalOpen(true)
  }

  const handleToggleActive = async (guide: CollectiveGuide) => {
    try {
      setIsSubmitting(true)
      const newValue = !guide.is_active

      await axios.patch(
        `/api/agents/${agent._id}/collective-memory/${guide._id}`,
        {
          is_active: newValue,
        },
      )

      setGuides(prev =>
        prev.map(s =>
          s._id === guide._id ? { ...s, is_active: newValue } : s,
        ),
      )

      toast.success(`Memory ${newValue ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error toggling active state:', error)
      const errorMessage = getErrorMessage(
        error,
        'Failed to update active state',
      )
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldSubmit = async (data: MemoryFormDto) => {
    if (!editingGuide || !editingField) {
      console.warn(
        'handleFieldSubmit called without editingGuide or editingField',
        { editingGuide, editingField },
      )
      return
    }

    console.log('handleFieldSubmit called', { editingField, data })

    // This function now only handles extraction_prompt (content is handled by separate flow)
    try {
      setIsSubmitting(true)
      const updateData = { [editingField]: data[editingField] || '' }

      await axios.patch(
        `/api/agents/${agent._id}/collective-memory/${editingGuide._id}`,
        updateData,
      )

      setGuides(prev =>
        prev.map(s =>
          s._id === editingGuide._id ? { ...s, ...updateData } : s,
        ),
      )

      toast.success(`${editingField.replace('_', ' ')} updated successfully`)
      setIsEditModalOpen(false)
      setEditingGuide(null)
      setEditingField(null)
    } catch (error) {
      console.error('Error updating field:', error)
      const errorMessage = getErrorMessage(error, 'Failed to update field')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMemoryEdit = (memory: MemorySession) => {
    setEditingMemory(memory)
    memoryForm.setValue('content', memory.content)
    setIsMemoryEditModalOpen(true)
  }

  const handleMemoryUpdate = async (data: { content: string }) => {
    if (!editingMemory) return

    // Show confirmation dialog first
    setPendingMemoryData(data)
    setIsMemoryConfirmationOpen(true)
  }

  const handleContentEdit = (guide: CollectiveGuide) => {
    setEditingGuide(guide)
    contentForm.setValue('content', guide.content || '')
    setIsContentEditModalOpen(true)
  }

  const handleContentUpdate = async (data: { content: string }) => {
    if (!editingGuide) return

    // Show confirmation dialog first
    setPendingContentData(data)
    setIsContentConfirmationOpen(true)
  }

  const handleConfirmedContentUpdate = async () => {
    if (!editingGuide || !pendingContentData) return

    try {
      setIsSubmitting(true)
      await axios.patch(
        `/api/agents/${agent._id}/collective-memory/${editingGuide._id}`,
        {
          content: pendingContentData.content || '',
        },
      )

      setGuides(prev =>
        prev.map(s =>
          s._id === editingGuide._id
            ? { ...s, content: pendingContentData.content }
            : s,
        ),
      )

      toast.success('Memory updated successfully')
      setIsContentEditModalOpen(false)
      setIsContentConfirmationOpen(false)
      setEditingGuide(null)
      setPendingContentData(null)
    } catch (error) {
      console.error('Error updating memory content:', error)
      const errorMessage = getErrorMessage(
        error,
        'Failed to update memory content',
      )
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmedMemoryUpdate = async () => {
    if (!editingMemory || !pendingMemoryData) return

    try {
      setIsSubmitting(true)
      await axios.patch(`/api/memory-sessions/${editingMemory._id}`, {
        content: pendingMemoryData.content || '',
      })

      // Update local state for both facts and unabsorbed_memory_ids
      setGuides(prev =>
        prev.map(guide => ({
          ...guide,
          facts: guide.facts.map(f =>
            f._id === editingMemory._id
              ? { ...f, content: pendingMemoryData.content }
              : f,
          ),
          unabsorbed_memory_ids: guide.unabsorbed_memory_ids.map(u =>
            u._id === editingMemory._id
              ? { ...u, content: pendingMemoryData.content }
              : u,
          ),
        })),
      )

      toast.success('Memory updated successfully')
      setIsMemoryEditModalOpen(false)
      setEditingMemory(null)
      setPendingMemoryData(null)
    } catch (error) {
      console.error('Error updating memory:', error)
      const errorMessage = getErrorMessage(error, 'Failed to update memory')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMemoryDelete = async (
    guide: CollectiveGuide,
    memory: MemorySession,
    arrayField: 'facts' | 'unabsorbed_memory_ids',
  ) => {
    try {
      setIsSubmitting(true)
      await axios.delete(
        `/api/agents/${agent._id}/collective-memory/${guide._id}/memory/${memory._id}`,
        {
          data: { arrayField },
        },
      )

      // Update local state
      setGuides(prev =>
        prev.map(s =>
          s._id === guide._id
            ? {
                ...s,
                [arrayField]: s[arrayField].filter(m => m._id !== memory._id),
              }
            : s,
        ),
      )

      toast.success('Memory removed successfully')
    } catch (error) {
      console.error('Error deleting memory:', error)
      const errorMessage = getErrorMessage(error, 'Failed to remove memory')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateNewGuide = async (data: NewGuideFormDto) => {
    try {
      setIsSubmitting(true)
      await axios.post(`/api/agents/${agent._id}/collective-memory`, {
        guide_name: data.guide_name,
        extraction_prompt: data.extraction_prompt,
      })

      // Reload the guides to get the newly created one
      const guidesResponse = await axios.get(
        `/api/agents/${agent._id}/collective-memory`,
      )
      setGuides(guidesResponse.data.shards || [])

      toast.success('Collective Memory created successfully')
      setIsNewGuideModalOpen(false)
      newGuideForm.reset()
    } catch (error) {
      console.error('Error creating new guide:', error)
      const errorMessage = getErrorMessage(
        error,
        'Failed to create collective memory',
      )
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-lg bg-muted border border-border">
          <span className="text-muted-foreground font-medium">
            {needsPreview ? (
              <>
                🚀 Collective Memory is coming soon...
                <br />
                This feature is currently in preview and will be available to
                pro tier users soon.
              </>
            ) : (
              <>
                🌐 Collective memory is only available to &gt;pro tier users.
                <br />
                <a
                  href="/settings/subscription"
                  className="underline hover:text-foreground transition-colors"
                >
                  Upgrade your subscription
                </a>{' '}
                to enable Collective Memory for {agent.name}
              </>
            )}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <span className="text-muted-foreground">
          Loading collective memory...
        </span>
      </div>
    )
  }

  if (guides.length === 0) {
    return (
      <TooltipProvider>
        <div className="text-center py-16">
          <div className="mb-6">
            <span className="text-muted-foreground italic">
              No collective memory found.
            </span>
          </div>
          <Button
            onClick={() => setIsNewGuideModalOpen(true)}
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create a new Collective Memory
          </Button>
        </div>

        {/* New Guide Creation Modal */}
        <Dialog
          open={isNewGuideModalOpen}
          onOpenChange={setIsNewGuideModalOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create a new Collective Memory</DialogTitle>
              <DialogDescription>
                Create a new collective memory to organize and extract specific
                types of information from conversations.
              </DialogDescription>
            </DialogHeader>
            <Form {...newGuideForm}>
              <form
                onSubmit={newGuideForm.handleSubmit(handleCreateNewGuide)}
                className="space-y-4"
              >
                <FormField
                  control={newGuideForm.control}
                  name="guide_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guide name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A simple name to remember the purpose of this Guide"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span></span>
                        <span>
                          {field.value?.length || 0} /{' '}
                          {MEMORY_LIMITS.SHARD_NAME_MAX_CHARS}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newGuideForm.control}
                  name="extraction_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memory instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="The memory instructions tell the agent what this Collective Memory is for, what kinds of information are relevant and what kinds of facts and ideas should be remembered. Clearly describing the purpose of this Collective Memory is essential to make things work well. Iterate over time!"
                          className="min-h-[50vh] resize-y flex-1"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span
                          className={`text-xs ${
                            (field.value?.length || 0) <
                            MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {MEMORY_UI_MESSAGES.EXTRACTION_PROMPT_MIN_REQUIRED}
                        </span>
                        <span>
                          {field.value?.length || 0} /{' '}
                          {MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-auto pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNewGuideModalOpen(false)
                      newGuideForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (newGuideForm.watch('extraction_prompt')?.length || 0) <
                        MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS
                    }
                    className="min-w-[100px]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create Guide'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    )
  }

  // For now, only show the first guide (as specified in requirements)
  const guide = guides[0]

  return (
    <TooltipProvider>
      <div className="space-y-8 px-2">
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-border rounded-full"></div>
              {/* Memory Type Toggle - A/B style buttons */}
              {showTabToggle ? (
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onTabChange?.('user')}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors cursor-help w-32 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        User
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>
                        This is your personal preferences memory with{' '}
                        {agent.name}, extracted from all your conversations with
                        this agent. These memories only affect your own
                        interactions with {agent.name} and primarily store
                        custom instructions you give to the agent.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="w-px bg-border h-8"></div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onTabChange?.('collective')}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors cursor-help w-32 bg-primary text-primary-foreground"
                      >
                        Collective
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>
                        This is {agent.name}'s collective memory. This memory is
                        formed and evolved by all its conversations with all
                        users. Collective memory is a powerful, experimental
                        feature that enables many new applications for creative
                        agents that are driven by collective group interaction.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-foreground ml-2">
                  Collective Memory
                </h2>
              )}
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Active/Paused Toggle - Inline with title */}
            <div className="flex items-center gap-3 md:justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`text-sm font-medium cursor-help ${
                      guide.is_active
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {guide.is_active ? 'Active' : 'Paused'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {guide.is_active
                      ? 'This memory is active and will be used in conversations'
                      : 'This memory is paused and will not be used in conversations'}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Switch
                checked={guide.is_active || false}
                onCheckedChange={() => handleToggleActive(guide)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Extraction Prompt Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-md font-medium text-foreground cursor-help">
                    Memory Instructions
                  </h3>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p>
                    This prompt tells {agent.name} what information to remember
                    from its conversations. Explain the agent what the goal of
                    this collective memory is and which things are important for
                    it to remember. This prompt is the most crucial part of
                    making collective memory work well. Iterate on this a lot!
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="group relative rounded-lg border border-border bg-card shadow-sm">
              <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[72px] max-h-[180px] overflow-y-auto">
                {guide.extraction_prompt || (
                  <span className="text-muted-foreground italic">
                    No extraction prompt set
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleFieldEdit(guide, 'extraction_prompt')}
                size="sm"
                className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Divider between user input and auto-generated content */}
          <div className="my-8 border-t border-border/40"></div>

          {/* Memory Content Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-6 bg-blue-400/60 dark:bg-blue-600/60 rounded-full"></div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="text-md font-medium text-foreground cursor-help">
                    Memory
                  </h3>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p>
                    This is the main blob of collective memory for this agent,
                    evolving over time through collective interaction with all
                    users.
                  </p>
                </TooltipContent>
              </Tooltip>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            <div className="group relative rounded-lg border border-border bg-blue-50/20 dark:bg-blue-950/15 shadow-sm">
              <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[216px] max-h-[450px] overflow-y-auto">
                {guide.content || (
                  <span className="text-muted-foreground italic">
                    💭 No collective memory content yet. This will be populated
                    automatically as users interact with {agent.name}.
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleContentEdit(guide)}
                size="sm"
                className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Unabsorbed Memory IDs Array - Now called "New Context" and shown before Facts */}
          {guide.unabsorbed_memory_ids.length > 0 && (
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-yellow-400/60 dark:bg-yellow-600/60 rounded-full"></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h2 className="text-lg font-semibold text-foreground cursor-help">
                      Recent Context
                    </h2>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p>
                      These are recent ideas and suggestions that are being
                      considered for integration into the collective memory.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs bg-yellow-100/40 dark:bg-yellow-900/25 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full border border-yellow-200/40 dark:border-yellow-800/40">
                  Will be integrated soon
                </span>
              </div>
              <div className="grid gap-2">
                {guide.unabsorbed_memory_ids.map(memory => (
                  <div key={memory._id} className="relative group">
                    <div className="rounded-lg border border-border bg-yellow-50/25 dark:bg-yellow-950/15 hover:bg-yellow-100/35 dark:hover:bg-yellow-900/25 transition-colors">
                      <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                        <div className="text-foreground">{memory.content}</div>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          onClick={() => handleMemoryEdit(memory)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() =>
                            handleMemoryDelete(
                              guide,
                              memory,
                              'unabsorbed_memory_ids',
                            )
                          }
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-muted text-destructive hover:text-destructive rounded-full"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facts Array - Now shown after New Context */}
          {guide.facts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-green-400/60 dark:bg-green-600/60 rounded-full"></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h2 className="text-lg font-semibold text-foreground cursor-help">
                      Facts
                    </h2>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p>
                      These are atomic facts the agent has picked up from its
                      interactions which are relevant to its collective memory
                      goal. Remove any facts that aren't relevant and update the
                      extraction prompt accordingly.
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs bg-green-100/40 dark:bg-green-900/25 text-green-700 dark:text-green-300 px-2 py-1 rounded-full border border-green-200/40 dark:border-green-800/40">
                  {guide.facts.length} facts
                </span>
              </div>
              <div className="grid gap-2">
                {guide.facts.map(fact => {
                  const ageInDays = calculateAgeInDays(fact.updatedAt)
                  return (
                    <div key={fact._id} className="relative group">
                      <div className="rounded-lg border border-border bg-green-50/20 dark:bg-green-950/15 hover:bg-green-100/30 dark:hover:bg-green-900/20 transition-colors">
                        <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                          <div className="text-foreground">{fact.content}</div>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Age text */}
                          <div className="text-xs text-muted-foreground font-medium">
                            {ageInDays === 0
                              ? 'Today'
                              : ageInDays === 1
                              ? '1 day old'
                              : `${ageInDays} days old`}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleMemoryEdit(fact)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() =>
                                handleMemoryDelete(guide, fact, 'facts')
                              }
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted text-destructive hover:text-destructive rounded-full"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Field Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[80vw] max-w-none h-[90vh] max-h-none flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Edit{' '}
              {editingField === 'content'
                ? 'Memory Content'
                : 'Memory Instructions'}
            </DialogTitle>
            <DialogDescription>
              {editingField === 'content'
                ? 'Edit the main collective memory content'
                : 'Memory guides instruct your agent what they should pay attention to and what kind of memories to form'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFieldSubmit)}
              className="space-y-4 flex-1 flex flex-col"
            >
              <FormField
                control={form.control}
                name={editingField || 'content'}
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormControl className="flex-1">
                      <Textarea
                        placeholder={
                          editingField === 'content'
                            ? 'Enter collective memory content...'
                            : 'Enter extraction prompt...'
                        }
                        className="min-h-0 resize-none flex-1 h-full"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span
                        className={`text-xs ${
                          editingField === 'extraction_prompt' &&
                          (field.value?.length || 0) <
                            MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {editingField === 'extraction_prompt'
                          ? MEMORY_UI_MESSAGES.EXTRACTION_PROMPT_MIN_REQUIRED
                          : ''}
                      </span>
                      <span>
                        {field.value?.length || 0} /{' '}
                        {editingField === 'content'
                          ? MEMORY_LIMITS.MEMORY_CONTENT_MAX_CHARS
                          : MEMORY_LIMITS.EXTRACTION_PROMPT_MAX_CHARS}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-auto pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingGuide(null)
                    setEditingField(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (editingField === 'extraction_prompt' &&
                      (form.watch('extraction_prompt')?.length || 0) <
                        MEMORY_LIMITS.EXTRACTION_PROMPT_MIN_CHARS)
                  }
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Memory Edit Modal */}
      <Dialog
        open={isMemoryEditModalOpen}
        onOpenChange={setIsMemoryEditModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Memory Session</DialogTitle>
            <DialogDescription>
              Edit this memory session content
            </DialogDescription>
          </DialogHeader>
          <Form {...memoryForm}>
            <form
              onSubmit={memoryForm.handleSubmit(handleMemoryUpdate)}
              className="space-y-4"
            >
              <FormField
                control={memoryForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter memory content..."
                        className="min-h-[50vh] resize-y flex-1"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>
                        {field.value?.length || 0} /{' '}
                        {MEMORY_LIMITS.FACTS_MAX_CHARS}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-auto pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsMemoryEditModalOpen(false)
                    setEditingMemory(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Content Edit Modal */}
      <Dialog
        open={isContentEditModalOpen}
        onOpenChange={setIsContentEditModalOpen}
      >
        <DialogContent className="w-[80vw] max-w-none h-[90vh] max-h-none flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Memory Content</DialogTitle>
            <DialogDescription>
              Edit the main collective memory content
            </DialogDescription>
          </DialogHeader>
          <Form {...contentForm}>
            <form
              onSubmit={contentForm.handleSubmit(handleContentUpdate)}
              className="space-y-4 flex-1 flex flex-col"
            >
              <FormField
                control={contentForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                    <FormControl className="flex-1">
                      <Textarea
                        placeholder="Enter collective memory content..."
                        className="min-h-0 resize-none flex-1 h-full"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>
                        {field.value?.length || 0} /{' '}
                        {MEMORY_LIMITS.MEMORY_CONTENT_MAX_CHARS}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-auto pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsContentEditModalOpen(false)
                    setEditingGuide(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Memory Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isMemoryConfirmationOpen}
        onOpenChange={setIsMemoryConfirmationOpen}
        onConfirm={handleConfirmedMemoryUpdate}
        title="Modify Memory"
        description="Are you sure you want to modify this memory? Saving this will cause the original memory to be lost!"
        isSubmitting={isSubmitting}
      />

      {/* Content Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isContentConfirmationOpen}
        onOpenChange={setIsContentConfirmationOpen}
        onConfirm={handleConfirmedContentUpdate}
        title="Modify Memory Content"
        description="Are you sure you want to modify this memory content? Saving this will cause the original content to be lost!"
        isSubmitting={isSubmitting}
      />
    </TooltipProvider>
  )
}

export default CollectiveMemory
