'use client'

import {
  MEMORY2_ERROR_MESSAGES,
  MEMORY2_LIMITS,
  formatRelativeAge,
} from './memory2-constants'
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
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Edit, Loader2, Trash2 } from 'lucide-react'
import { FC, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Schema for memory form
const memorySchema = z.object({
  content: z
    .string()
    .max(
      MEMORY2_LIMITS.AGENT_CONSOLIDATED_MAX_CHARS,
      MEMORY2_ERROR_MESSAGES.AGENT_CONSOLIDATED_MAX_CHARS,
    )
    .optional(),
})

const reflectionSchema = z.object({
  content: z
    .string()
    .max(
      MEMORY2_LIMITS.REFLECTION_MAX_CHARS,
      MEMORY2_ERROR_MESSAGES.REFLECTION_MAX_CHARS,
    )
    .optional(),
})

const factSchema = z.object({
  content: z
    .string()
    .max(MEMORY2_LIMITS.FACT_MAX_CHARS, MEMORY2_ERROR_MESSAGES.FACT_MAX_CHARS)
    .optional(),
})

type MemoryFormDto = z.infer<typeof memorySchema>
type ReflectionFormDto = z.infer<typeof reflectionSchema>
type FactFormDto = z.infer<typeof factSchema>

interface Reflection {
  _id: string
  content: string
  formed_at: string
}

interface Fact {
  _id: string
  content: string
  formed_at: string
  scope: string[]
  access_count: number
}

interface CollectiveMemory2Props {
  agent: Agent
  hasEditAccess: boolean
}

const CollectiveMemory2: FC<CollectiveMemory2Props> = ({
  agent,
  hasEditAccess,
}) => {
  const [consolidatedContent, setConsolidatedContent] = useState('')
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(
    agent.agent_memory_enabled ?? false,
  )
  const [isTogglingMemory, setIsTogglingMemory] = useState(false)

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReflectionEditModalOpen, setIsReflectionEditModalOpen] =
    useState(false)
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(
    null,
  )
  const [isFactEditModalOpen, setIsFactEditModalOpen] = useState(false)
  const [editingFact, setEditingFact] = useState<Fact | null>(null)

  // Confirmation states
  const [isContentConfirmationOpen, setIsContentConfirmationOpen] =
    useState(false)
  const [pendingContentData, setPendingContentData] =
    useState<MemoryFormDto | null>(null)
  const [isReflectionConfirmationOpen, setIsReflectionConfirmationOpen] =
    useState(false)
  const [pendingReflectionData, setPendingReflectionData] =
    useState<ReflectionFormDto | null>(null)
  const [isFactConfirmationOpen, setIsFactConfirmationOpen] = useState(false)
  const [pendingFactData, setPendingFactData] = useState<FactFormDto | null>(
    null,
  )

  const form = useForm<MemoryFormDto>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      content: '',
    },
  })

  const reflectionForm = useForm<ReflectionFormDto>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      content: '',
    },
  })

  const factForm = useForm<FactFormDto>({
    resolver: zodResolver(factSchema),
    defaultValues: {
      content: '',
    },
  })

  // Sort reflections by date (newest first)
  const sortedReflections = useMemo(() => {
    return [...reflections].sort(
      (a, b) =>
        new Date(b.formed_at).getTime() - new Date(a.formed_at).getTime(),
    )
  }, [reflections])

  // Sort facts by date (newest first)
  const sortedFacts = useMemo(() => {
    return [...facts].sort(
      (a, b) =>
        new Date(b.formed_at).getTime() - new Date(a.formed_at).getTime(),
    )
  }, [facts])

  const handleToggleMemory = async (enabled: boolean) => {
    setIsTogglingMemory(true)
    try {
      await axios.patch(`/api/agents/${agent._id}/agent-memory-enabled`, {
        agent_memory_enabled: enabled,
      })
      setIsMemoryEnabled(enabled)
      toast.success(
        enabled ? 'Collective memory enabled' : 'Collective memory disabled',
      )
    } catch (error) {
      console.error('Error toggling collective memory:', error)
      toast.error('Failed to update memory setting')
    } finally {
      setIsTogglingMemory(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!agent) return

      try {
        const response = await axios.get(
          `/api/agents/${agent._id}/memory2-agent`,
        )
        setConsolidatedContent(response.data.consolidated_content || '')
        setReflections(response.data.unabsorbed_reflections || [])
        setFacts(response.data.facts || [])
      } catch (error) {
        console.error('Error loading collective memory2 data:', error)
        setConsolidatedContent('')
        setReflections([])
        setFacts([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [agent._id])

  // Content handlers
  const handleContentEdit = () => {
    form.setValue('content', consolidatedContent)
    setIsEditModalOpen(true)
  }

  const handleContentUpdate = async (data: MemoryFormDto) => {
    setPendingContentData(data)
    setIsContentConfirmationOpen(true)
  }

  const handleConfirmedContentUpdate = async () => {
    if (!pendingContentData) return

    try {
      setIsSubmitting(true)
      await axios.post(`/api/agents/${agent._id}/memory2-agent`, {
        content: pendingContentData.content || '',
      })

      setConsolidatedContent(pendingContentData.content || '')
      toast.success('Memory saved successfully')
      setIsEditModalOpen(false)
      setIsContentConfirmationOpen(false)
      setPendingContentData(null)
    } catch (error) {
      console.error('Error saving memory:', error)
      toast.error('Failed to save memory. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reflection handlers
  const handleReflectionEdit = (reflection: Reflection) => {
    setEditingReflection(reflection)
    reflectionForm.setValue('content', reflection.content)
    setIsReflectionEditModalOpen(true)
  }

  const handleReflectionUpdate = async (data: ReflectionFormDto) => {
    setPendingReflectionData(data)
    setIsReflectionConfirmationOpen(true)
  }

  const handleConfirmedReflectionUpdate = async () => {
    if (!editingReflection || !pendingReflectionData) return

    try {
      setIsSubmitting(true)
      await axios.patch(`/api/memory2-reflections/${editingReflection._id}`, {
        content: pendingReflectionData.content || '',
      })

      setReflections(prev =>
        prev.map(r =>
          r._id === editingReflection._id
            ? { ...r, content: pendingReflectionData.content || '' }
            : r,
        ),
      )

      toast.success('Reflection updated successfully')
      setIsReflectionEditModalOpen(false)
      setIsReflectionConfirmationOpen(false)
      setEditingReflection(null)
      setPendingReflectionData(null)
    } catch (error) {
      console.error('Error updating reflection:', error)
      toast.error('Failed to update reflection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReflectionDelete = async (reflectionId: string) => {
    const reflectionToDelete = reflections.find(r => r._id === reflectionId)
    if (!reflectionToDelete) return

    setReflections(prev => prev.filter(r => r._id !== reflectionId))

    try {
      await axios.delete(`/api/memory2-reflections/${reflectionId}`)
    } catch (error) {
      setReflections(prev => [...prev, reflectionToDelete])
      console.error('Error deleting reflection:', error)
      toast.error('Failed to remove reflection. Please try again.')
    }
  }

  // Fact handlers
  const handleFactEdit = (fact: Fact) => {
    setEditingFact(fact)
    factForm.setValue('content', fact.content)
    setIsFactEditModalOpen(true)
  }

  const handleFactUpdate = async (data: FactFormDto) => {
    setPendingFactData(data)
    setIsFactConfirmationOpen(true)
  }

  const handleConfirmedFactUpdate = async () => {
    if (!editingFact || !pendingFactData) return

    try {
      setIsSubmitting(true)
      await axios.patch(`/api/memory2-facts/${editingFact._id}`, {
        content: pendingFactData.content || '',
      })

      setFacts(prev =>
        prev.map(f =>
          f._id === editingFact._id
            ? { ...f, content: pendingFactData.content || '' }
            : f,
        ),
      )

      toast.success('Fact updated successfully')
      setIsFactEditModalOpen(false)
      setIsFactConfirmationOpen(false)
      setEditingFact(null)
      setPendingFactData(null)
    } catch (error) {
      console.error('Error updating fact:', error)
      toast.error('Failed to update fact. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFactDelete = async (factId: string) => {
    const factToDelete = facts.find(f => f._id === factId)
    if (!factToDelete) return

    setFacts(prev => prev.filter(f => f._id !== factId))

    try {
      await axios.delete(`/api/memory2-facts/${factId}`)
    } catch (error) {
      setFacts(prev => [...prev, factToDelete])
      console.error('Error deleting fact:', error)
      toast.error('Failed to remove fact. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-2">
      {/* Memory Toggle */}
      {hasEditAccess && (
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <Label
              htmlFor="agent-memory-toggle"
              className="text-sm font-medium"
            >
              Collective Memory
            </Label>
            <p className="text-xs text-muted-foreground">
              Allow {agent.name} to build shared memory across all conversations
            </p>
          </div>
          <Switch
            id="agent-memory-toggle"
            checked={isMemoryEnabled}
            onCheckedChange={handleToggleMemory}
            disabled={isTogglingMemory}
          />
        </div>
      )}

      {/* Disabled state message */}
      {!isMemoryEnabled && (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">Collective memory disabled</p>
        </div>
      )}

      {/* Memory Content Section - only show when enabled */}
      {isMemoryEnabled && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-purple-400/50 dark:bg-purple-600/50 rounded-full"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-md font-medium text-foreground cursor-help">
                  Collective Memory
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
          <div className="group relative rounded-lg border border-border bg-purple-50/15 dark:bg-purple-950/10 shadow-sm">
            <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[216px] max-h-[450px] overflow-y-auto">
              {consolidatedContent || (
                <span className="text-muted-foreground italic">
                  No collective memory content yet. This will be populated
                  automatically as users interact with {agent.name}.
                </span>
              )}
            </div>
            {hasEditAccess && (
              <Button
                onClick={handleContentEdit}
                size="sm"
                className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 h-8 w-8 p-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Recent Reflections (suggestions) Section - only show when enabled */}
      {isMemoryEnabled && sortedReflections.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-yellow-400/50 dark:bg-yellow-600/50 rounded-full"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <h2 className="text-lg font-semibold text-foreground cursor-help">
                  Recent Memory Context
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
            <span className="text-xs bg-yellow-100/30 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full border border-yellow-200/30 dark:border-yellow-800/30">
              Will be integrated soon
            </span>
          </div>
          <div className="grid gap-2">
            {sortedReflections.map(reflection => (
              <Tooltip key={reflection._id}>
                <TooltipTrigger asChild>
                  <div className="relative group cursor-default">
                    <div className="rounded-lg border border-border bg-yellow-50/20 dark:bg-yellow-950/10 hover:bg-yellow-100/25 dark:hover:bg-yellow-900/15 transition-colors">
                      <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                        <div className="text-foreground">
                          {reflection.content}
                        </div>
                      </div>
                      {hasEditAccess && (
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            onClick={() => handleReflectionEdit(reflection)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() =>
                              handleReflectionDelete(reflection._id)
                            }
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-muted text-destructive hover:text-destructive rounded-full"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatRelativeAge(reflection.formed_at)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Facts Section - only show when enabled */}
      {isMemoryEnabled && sortedFacts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-green-400/50 dark:bg-green-600/50 rounded-full"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <h2 className="text-lg font-semibold text-foreground cursor-help">
                  Facts
                </h2>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p>
                  These are atomic facts the agent has picked up from its
                  interactions. They are used for RAG retrieval to provide
                  relevant context during conversations.
                </p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs bg-green-100/30 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full border border-green-200/30 dark:border-green-800/30">
              {sortedFacts.length} facts
            </span>
          </div>
          <div className="grid gap-2">
            {sortedFacts.map(fact => (
              <Tooltip key={fact._id}>
                <TooltipTrigger asChild>
                  <div className="relative group cursor-default">
                    <div className="rounded-lg border border-border bg-green-50/15 dark:bg-green-950/10 hover:bg-green-100/20 dark:hover:bg-green-900/15 transition-colors">
                      <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                        <div className="text-foreground">{fact.content}</div>
                      </div>
                      {hasEditAccess && (
                        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {fact.access_count > 0 && (
                            <span className="text-xs text-muted-foreground font-medium">
                              accessed {fact.access_count}x
                            </span>
                          )}
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleFactEdit(fact)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleFactDelete(fact._id)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted text-destructive hover:text-destructive rounded-full"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatRelativeAge(fact.formed_at)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Content Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[80vw] max-w-none h-[90vh] max-h-none flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Collective Memory</DialogTitle>
            <DialogDescription>
              Edit the main collective memory content for this agent.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleContentUpdate)}
              className="space-y-4 flex-1 flex flex-col"
            >
              <FormField
                control={form.control}
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
                        {MEMORY2_LIMITS.AGENT_CONSOLIDATED_MAX_CHARS}
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
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* Reflection Edit Modal */}
      <Dialog
        open={isReflectionEditModalOpen}
        onOpenChange={setIsReflectionEditModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Reflection</DialogTitle>
            <DialogDescription>
              Edit this recent reflection content
            </DialogDescription>
          </DialogHeader>
          <Form {...reflectionForm}>
            <form
              onSubmit={reflectionForm.handleSubmit(handleReflectionUpdate)}
              className="space-y-4"
            >
              <FormField
                control={reflectionForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter reflection content..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>
                        {field.value?.length || 0} /{' '}
                        {MEMORY2_LIMITS.REFLECTION_MAX_CHARS}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReflectionEditModalOpen(false)
                    setEditingReflection(null)
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

      {/* Fact Edit Modal */}
      <Dialog open={isFactEditModalOpen} onOpenChange={setIsFactEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fact</DialogTitle>
            <DialogDescription>Edit this fact content</DialogDescription>
          </DialogHeader>
          <Form {...factForm}>
            <form
              onSubmit={factForm.handleSubmit(handleFactUpdate)}
              className="space-y-4"
            >
              <FormField
                control={factForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter fact content..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>
                        {field.value?.length || 0} /{' '}
                        {MEMORY2_LIMITS.FACT_MAX_CHARS}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFactEditModalOpen(false)
                    setEditingFact(null)
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

      {/* Content Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isContentConfirmationOpen}
        onOpenChange={setIsContentConfirmationOpen}
        onConfirm={handleConfirmedContentUpdate}
        title="Modify Collective Memory"
        description="Are you sure you want to modify this memory? Saving this will cause the original content to be lost!"
        isSubmitting={isSubmitting}
      />

      {/* Reflection Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isReflectionConfirmationOpen}
        onOpenChange={setIsReflectionConfirmationOpen}
        onConfirm={handleConfirmedReflectionUpdate}
        title="Modify Reflection"
        description="Are you sure you want to modify this reflection? Saving this will cause the original content to be lost!"
        isSubmitting={isSubmitting}
      />

      {/* Fact Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isFactConfirmationOpen}
        onOpenChange={setIsFactConfirmationOpen}
        onConfirm={handleConfirmedFactUpdate}
        title="Modify Fact"
        description="Are you sure you want to modify this fact? Saving this will cause the original content to be lost!"
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

export default CollectiveMemory2
