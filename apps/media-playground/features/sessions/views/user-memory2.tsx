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
      MEMORY2_LIMITS.USER_CONSOLIDATED_MAX_CHARS,
      MEMORY2_ERROR_MESSAGES.USER_CONSOLIDATED_MAX_CHARS,
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

type MemoryFormDto = z.infer<typeof memorySchema>
type ReflectionFormDto = z.infer<typeof reflectionSchema>

interface Reflection {
  _id: string
  content: string
  formed_at: string
}

interface UserMemory2Props {
  agent: Agent
  hasEditAccess: boolean
}

const UserMemory2: FC<UserMemory2Props> = ({ agent, hasEditAccess }) => {
  const [consolidatedContent, setConsolidatedContent] = useState('')
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReflectionEditModalOpen, setIsReflectionEditModalOpen] =
    useState(false)
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(
    null,
  )
  const [isContentConfirmationOpen, setIsContentConfirmationOpen] =
    useState(false)
  const [pendingContentData, setPendingContentData] =
    useState<MemoryFormDto | null>(null)
  const [isReflectionConfirmationOpen, setIsReflectionConfirmationOpen] =
    useState(false)
  const [pendingReflectionData, setPendingReflectionData] =
    useState<ReflectionFormDto | null>(null)

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

  // Sort reflections by date (newest first)
  const sortedReflections = useMemo(() => {
    return [...reflections].sort(
      (a, b) =>
        new Date(b.formed_at).getTime() - new Date(a.formed_at).getTime(),
    )
  }, [reflections])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!agent) return

      try {
        const response = await axios.get(`/api/agents/${agent._id}/memory2`)
        setConsolidatedContent(response.data.consolidated_content || '')
        setReflections(response.data.unabsorbed_reflections || [])
      } catch (error) {
        console.error('Error loading memory2 data:', error)
        setConsolidatedContent('')
        setReflections([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [agent._id])

  const handleEditClick = () => {
    form.setValue('content', consolidatedContent)
    setIsEditModalOpen(true)
  }

  const handleContentUpdate = async (data: MemoryFormDto) => {
    // Show confirmation dialog first
    setPendingContentData(data)
    setIsContentConfirmationOpen(true)
  }

  const handleConfirmedContentUpdate = async () => {
    if (!pendingContentData) return

    try {
      setIsSubmitting(true)
      await axios.post(`/api/agents/${agent._id}/memory2`, {
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

  const handleReflectionEdit = (reflection: Reflection) => {
    setEditingReflection(reflection)
    reflectionForm.setValue('content', reflection.content)
    setIsReflectionEditModalOpen(true)
  }

  const handleReflectionUpdate = async (data: ReflectionFormDto) => {
    // Show confirmation dialog first
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

      // Update local state
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
    // Store the reflection being deleted for potential revert
    const reflectionToDelete = reflections.find(r => r._id === reflectionId)
    if (!reflectionToDelete) return

    // Optimistically update UI
    setReflections(prev => prev.filter(r => r._id !== reflectionId))

    try {
      await axios.delete(`/api/memory2-reflections/${reflectionId}`)
      // Success - no toast to avoid blocking UI
    } catch (error) {
      // Revert on error
      setReflections(prev => [...prev, reflectionToDelete])
      console.error('Error deleting reflection:', error)
      toast.error('Failed to remove reflection. Please try again.')
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
    <div className="space-y-8">
      {/* Consolidated Memory Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 border-b border-border/40 bg-card/60">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Personal Memory
            </p>
            <p className="text-sm text-muted-foreground/90">
              Context {agent.name} keeps about you
            </p>
          </div>
          {hasEditAccess && (
            <Button
              onClick={handleEditClick}
              size="sm"
              variant="secondary"
              className="h-8 px-3 rounded-full shadow-sm"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
        <div className="px-5 py-5 text-base leading-relaxed whitespace-pre-wrap min-h-[170px] max-h-[312px] overflow-y-auto text-foreground bg-card">
          {consolidatedContent || (
            <span className="block text-sm text-muted-foreground italic">
              No user memories stored yet. Just interact with {agent.name} and
              the agent will automatically build memory about you here.
            </span>
          )}
        </div>
      </div>

      {/* Recent Reflections Section */}
      {sortedReflections.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-border rounded-full"></div>
            <Tooltip>
              <TooltipTrigger asChild>
                <h2 className="text-lg font-semibold text-foreground cursor-help">
                  Recent Memory Context
                </h2>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p>
                  These are new reflections picked up from recent conversations
                  that will be integrated into your Personal Memory soon.
                </p>
              </TooltipContent>
            </Tooltip>
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full border border-border">
              Will be integrated soon
            </span>
          </div>
          <div className="grid gap-2">
            {sortedReflections.map(reflection => (
              <Tooltip key={reflection._id}>
                <TooltipTrigger asChild>
                  <div className="relative group cursor-default">
                    <div className="rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
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

      {/* Content Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[80vw] max-w-none h-[90vh] max-h-none flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit User Memory</DialogTitle>
            <DialogDescription>
              Edit your personal memory content with this agent.
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
                        placeholder="Enter memories, context, or notes about your conversations with this agent..."
                        className="min-h-0 resize-none flex-1 h-full"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>
                        {field.value?.length || 0} /{' '}
                        {MEMORY2_LIMITS.USER_CONSOLIDATED_MAX_CHARS}
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

      {/* Content Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isContentConfirmationOpen}
        onOpenChange={setIsContentConfirmationOpen}
        onConfirm={handleConfirmedContentUpdate}
        title="Modify User Memory"
        description="Are you sure you want to modify this memory? Saving this will cause the original memory to be lost!"
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
    </div>
  )
}

export default UserMemory2
