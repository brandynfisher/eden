'use client'

import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
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
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Edit, Loader2, Trash2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const memorySchema = z.object({
  content: z.string().optional(),
  extraction_prompt: z.string().optional(),
  is_active: z.boolean().optional(),
})

type MemoryFormDto = z.infer<typeof memorySchema>

interface MemorySession {
  _id: string
  content: string
  createdAt?: string
}

interface CollectiveShard {
  _id: string
  agent_id: any
  content?: string
  extraction_prompt?: string
  is_active?: boolean
  facts: MemorySession[]
  unabsorbed_memory_ids: MemorySession[]
}

interface CollectiveMemoryProps {
  agent: Agent
  hasAccess: boolean
}

const CollectiveMemory: FC<CollectiveMemoryProps> = ({ agent, hasAccess }) => {
  const [shards, setShards] = useState<CollectiveShard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<'content' | 'extraction_prompt' | null>(null)
  const [editingShard, setEditingShard] = useState<CollectiveShard | null>(null)
  const [isMemoryEditModalOpen, setIsMemoryEditModalOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<MemorySession | null>(null)

  const form = useForm<MemoryFormDto>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      content: '',
      extraction_prompt: '',
      is_active: false,
    },
  })

  const memoryForm = useForm<{ content: string }>({
    resolver: zodResolver(z.object({ content: z.string() })),
    defaultValues: { content: '' },
  })

  useEffect(() => {
    const loadCollectiveMemory = async () => {
      if (!agent || !hasAccess) {
        setIsLoading(false)
        return
      }

      try {
        const response = await axios.get(`/api/agents/${agent._id}/collective-memory`)
        console.log('DEBUG: Collective memory response:', response.data)
        setShards(response.data.shards || [])
      } catch (error) {
        console.error('Error loading collective memory:', error)
        setShards([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCollectiveMemory()
  }, [agent?._id, hasAccess])

  const handleFieldEdit = (shard: CollectiveShard, field: 'content' | 'extraction_prompt') => {
    setEditingShard(shard)
    setEditingField(field)
    form.setValue(field, shard[field] || '')
    setIsEditModalOpen(true)
  }

  const handleToggleActive = async (shard: CollectiveShard) => {
    try {
      setIsSubmitting(true)
      const newValue = !shard.is_active
      
      await axios.patch(`/api/agents/${agent._id}/collective-memory/${shard._id}`, {
        is_active: newValue,
      })

      setShards(prev =>
        prev.map(s => s._id === shard._id ? { ...s, is_active: newValue } : s)
      )

      toast.success(`Shard ${newValue ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error toggling active state:', error)
      toast.error('Failed to update active state')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldSubmit = async (data: MemoryFormDto) => {
    if (!editingShard || !editingField) return

    try {
      setIsSubmitting(true)
      const updateData = { [editingField]: data[editingField] || '' }
      
      await axios.patch(`/api/agents/${agent._id}/collective-memory/${editingShard._id}`, updateData)

      setShards(prev =>
        prev.map(s => s._id === editingShard._id ? { ...s, ...updateData } : s)
      )

      toast.success(`${editingField.replace('_', ' ')} updated successfully`)
      setIsEditModalOpen(false)
      setEditingShard(null)
      setEditingField(null)
    } catch (error) {
      console.error('Error updating field:', error)
      toast.error('Failed to update field')
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

    try {
      setIsSubmitting(true)
      await axios.patch(`/api/memory-sessions/${editingMemory._id}`, {
        content: data.content || '',
      })

      // Update local state for both facts and unabsorbed_memory_ids
      setShards(prev =>
        prev.map(shard => ({
          ...shard,
          facts: shard.facts.map(f => 
            f._id === editingMemory._id ? { ...f, content: data.content } : f
          ),
          unabsorbed_memory_ids: shard.unabsorbed_memory_ids.map(u => 
            u._id === editingMemory._id ? { ...u, content: data.content } : u
          ),
        }))
      )

      toast.success('Memory updated successfully')
      setIsMemoryEditModalOpen(false)
      setEditingMemory(null)
    } catch (error) {
      console.error('Error updating memory:', error)
      toast.error('Failed to update memory')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMemoryDelete = async (shard: CollectiveShard, memory: MemorySession, arrayField: 'facts' | 'unabsorbed_memory_ids') => {
    try {
      setIsSubmitting(true)
      await axios.delete(`/api/agents/${agent._id}/collective-memory/${shard._id}/memory/${memory._id}`, {
        data: { arrayField }
      })

      // Update local state
      setShards(prev =>
        prev.map(s => s._id === shard._id ? {
          ...s,
          [arrayField]: s[arrayField].filter(m => m._id !== memory._id)
        } : s)
      )

      toast.success('Memory removed successfully')
    } catch (error) {
      console.error('Error deleting memory:', error)
      toast.error('Failed to remove memory')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:bg-gradient-to-r dark:from-orange-900/10 dark:to-red-900/10 border border-orange-200/50 dark:border-orange-500/20 backdrop-blur-sm">
          <span className="text-orange-700 dark:text-orange-300 font-medium">
            🌐 Collective memory is only available to &gt;pro tier users.
            <br />
            <a 
              href="/settings/subscription" 
              className="underline hover:text-orange-600 dark:hover:text-orange-200 transition-colors"
            >
              Upgrade your subscription
            </a>{' '}
            to enable Collective Memory for {agent.name}
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <span className="text-muted-foreground">Loading collective memory...</span>
      </div>
    )
  }

  if (shards.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-muted-foreground italic">
          No collective memory shards found. Collective memory will be created automatically as users interact with {agent.name}.
        </span>
      </div>
    )
  }

  // For now, only show the first shard (as specified in requirements)
  const shard = shards[0]

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300 cursor-help">
                    Collective Memory
                  </h2>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>This is {agent.name}'s collective memory. This memory is formed and evolved by all its conversations with all users.</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-500/30"></div>
            </div>

            {/* Active/Paused Toggle - Inline with title */}
            <div className="flex items-center gap-3">
              <div className={`text-sm font-medium ${shard.is_active ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                {shard.is_active ? 'Active' : 'Paused'}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-4 h-4 rounded-full cursor-help ${shard.is_active ? 'bg-green-200 dark:bg-green-800' : 'bg-orange-200 dark:bg-orange-800'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{shard.is_active ? 'This memory shard is active and will be used in conversations' : 'This memory shard is paused and will not be used in conversations'}</p>
                </TooltipContent>
              </Tooltip>
              <Switch
                checked={shard.is_active || false}
                onCheckedChange={() => handleToggleActive(shard)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Extraction Prompt Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-md font-medium text-purple-700 dark:text-purple-300">Extraction Prompt</h3>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-purple-200/50 dark:border-purple-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10"></div>
              <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[60px] max-h-[150px] overflow-y-auto">
                {shard.extraction_prompt || (
                  <span className="text-muted-foreground italic">
                    No extraction prompt set
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleFieldEdit(shard, 'extraction_prompt')}
                size="sm"
                className="absolute bottom-3 right-3 bg-purple-500 hover:bg-purple-600 text-white shadow-md transition-all duration-200 hover:scale-105"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>

          {/* Memory Content Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-md font-medium text-blue-700 dark:text-blue-300">Memory</h3>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-blue-200/50 dark:border-blue-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10"></div>
              <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[120px] max-h-[250px] overflow-y-auto">
                {shard.content || (
                  <span className="text-muted-foreground italic">
                    💭 No collective memory content yet. This will be populated as users interact with {agent.name}.
                  </span>
                )}
              </div>
              <Button
                onClick={() => handleFieldEdit(shard, 'content')}
                size="sm"
                className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all duration-200 hover:scale-105"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>

          {/* Unabsorbed Memory IDs Array - Now called "New Context" and shown before Facts */}
          {shard.unabsorbed_memory_ids.length > 0 && (
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                  New Context
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-500/30"></div>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
                  Will be integrated soon
                </span>
              </div>
              <div className="grid gap-4">
                {shard.unabsorbed_memory_ids.map((memory, index) => (
                  <div key={memory._id} className="relative group">
                    <div className="relative overflow-hidden rounded-lg border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 to-orange-50/30 dark:from-amber-900/5 dark:to-orange-900/5"></div>
                      <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-medium mt-0.5 shadow-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 text-gray-700 dark:text-gray-300">
                            {memory.content}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          onClick={() => handleMemoryEdit(memory)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 hover:text-amber-700 rounded-full"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleMemoryDelete(shard, memory, 'unabsorbed_memory_ids')}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 rounded-full"
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
          {shard.facts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  Facts
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent dark:from-emerald-500/30"></div>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  {shard.facts.length} facts
                </span>
              </div>
              <div className="grid gap-4">
                {shard.facts.map((fact, index) => (
                  <div key={fact._id} className="relative group">
                    <div className="relative overflow-hidden rounded-lg border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 to-green-50/30 dark:from-emerald-900/5 dark:to-green-900/5"></div>
                      <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 flex items-center justify-center text-white text-xs font-medium mt-0.5 shadow-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 text-gray-700 dark:text-gray-300">
                            {fact.content}
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          onClick={() => handleMemoryEdit(fact)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 hover:text-emerald-700 rounded-full"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleMemoryDelete(shard, fact, 'facts')}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600 rounded-full"
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
        </div>
      </div>

      {/* Field Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit {editingField === 'content' ? 'Memory Content' : 'Extraction Prompt'}
            </DialogTitle>
            <DialogDescription>
              {editingField === 'content' 
                ? 'Edit the main collective memory content'
                : 'Edit the prompt used for extracting memories'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFieldSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name={editingField || 'content'}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder={
                          editingField === 'content' 
                            ? 'Enter collective memory content...'
                            : 'Enter extraction prompt...'
                        }
                        className="min-h-[300px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingShard(null)
                    setEditingField(null)
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

      {/* Memory Edit Modal */}
      <Dialog open={isMemoryEditModalOpen} onOpenChange={setIsMemoryEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Memory Session</DialogTitle>
            <DialogDescription>
              Edit this memory session content
            </DialogDescription>
          </DialogHeader>
          <Form {...memoryForm}>
            <form onSubmit={memoryForm.handleSubmit(handleMemoryUpdate)} className="space-y-4">
              <FormField
                control={memoryForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Enter memory content..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
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
    </TooltipProvider>
  )
}

export default CollectiveMemory