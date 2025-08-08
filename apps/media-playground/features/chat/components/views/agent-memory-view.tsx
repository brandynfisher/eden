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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthState } from '@/hooks/use-auth-state'
import { isAgentOwner } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Edit, Loader2, Trash2 } from 'lucide-react'
import { FC, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import CollectiveMemory from './collective-memory'

// Schema for memory form
const memorySchema = z.object({
  content: z.string().optional(),
})

type MemoryFormDto = z.infer<typeof memorySchema>

interface UnabsorbedDirective {
  _id: string
  content: string
  createdAt?: string
}

const AgentMemoryView: FC<{
  agent: Agent
  user: unknown
}> = ({ agent, user }) => {
  const { user: authUser } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unabsorbedDirectives, setUnabsorbedDirectives] = useState<UnabsorbedDirective[]>([])
  const [memoryTab, setMemoryTab] = useState<'user' | 'collective'>('user')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDirectiveEditModalOpen, setIsDirectiveEditModalOpen] = useState(false)
  const [editingDirective, setEditingDirective] = useState<UnabsorbedDirective | null>(null)
  const [displayContent, setDisplayContent] = useState('')

  const isOwner = useMemo(() => {
    return isAgentOwner(agent, authUser?._id)
  }, [agent, authUser])

  const isPreviewUser = authUser?.featureFlags?.includes(FeatureFlag.Preview)
  
  // Collective Memory Access Logic - Three Scenarios:
  // 1. Not owner: no tab visible (handled by isOwner check)
  // 2. Owner but no credentials: show upgrade message  
  // 3. Owner with credentials: show full functionality
  const collectiveMemoryAccess = useMemo(() => {
    if (!isOwner) {
      return { showTab: false, hasAccess: false }
    }
    
    // User is owner - always show tab
    if (!authUser) {
      return { showTab: true, hasAccess: false }
    }
    
    // Check subscription tier (2=pro, 3=believer) OR preview feature flag
    const hasProTier = authUser?.subscriptionTier >= 2
    const hasPreviewFlag = authUser?.featureFlags?.includes(FeatureFlag.Preview)
    const hasAccess = hasProTier || hasPreviewFlag
    
    return { showTab: true, hasAccess }
  }, [isOwner, authUser?.subscriptionTier, authUser?.featureFlags])

  const form = useForm<MemoryFormDto>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      content: '',
    },
  })

  const directiveForm = useForm<MemoryFormDto>({
    resolver: zodResolver(z.object({ 
      content: z.string().max(100, 'Directive content cannot exceed 100 characters').optional()
    })),
    defaultValues: {
      content: '',
    },
  })

  // Load existing memory data from memory_user collection
  useEffect(() => {
    const loadMemoryData = async () => {
      if (agent && authUser) {
        try {
          const response = await axios.get(`/api/agents/${agent._id}/memory`)

          console.log('DEBUG: API response:', response.data)
          console.log('DEBUG: unabsorbedDirectives from API:', response.data.unabsorbedDirectives)

          const content = response.data.content || ''
          form.setValue('content', content)
          setDisplayContent(content)
          setUnabsorbedDirectives(response.data.unabsorbedDirectives || [])
        } catch (error) {
          console.error('Error loading memory data:', error)
          form.setValue('content', '')
          setDisplayContent('')
          setUnabsorbedDirectives([])
        }
      }
    }

    loadMemoryData()
  }, [agent?._id, authUser, form])

  const handleSubmit = async (data: MemoryFormDto) => {
    if (!agent || !authUser) return

    try {
      setIsSubmitting(true)
      await axios.post(`/api/agents/${agent._id}/memory`, {
        content: data.content || '',
      })
      setDisplayContent(data.content || '')
      toast.success('Memory saved successfully')
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error saving memory for agent:', agent._id, error)

      const getErrorMessage = (error: unknown): string => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          switch (status) {
            case 403:
              return 'You do not have permission to edit this agent'
            case 404:
              return 'Agent not found'
            case 500:
              return 'Server error. Please try again later.'
            default:
              return 'Failed to save memory. Please try again.'
          }
        }
        return 'An unexpected error occurred. Please try again.'
      }

      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = () => {
    form.setValue('content', displayContent)
    setIsEditModalOpen(true)
  }

  const handleDirectiveEdit = (directive: UnabsorbedDirective) => {
    setEditingDirective(directive)
    directiveForm.setValue('content', directive.content)
    setIsDirectiveEditModalOpen(true)
  }

  const handleDirectiveUpdate = async (data: MemoryFormDto) => {
    if (!editingDirective || !agent || !authUser) return

    try {
      setIsSubmitting(true)
      await axios.patch(`/api/memory-sessions/${editingDirective._id}`, {
        content: data.content || '',
      })

      // Update the local state
      setUnabsorbedDirectives(prev =>
        prev.map(directive =>
          directive._id === editingDirective._id
            ? { ...directive, content: data.content || '' }
            : directive
        )
      )

      toast.success('Directive updated successfully')
      setIsDirectiveEditModalOpen(false)
      setEditingDirective(null)
    } catch (error) {
      console.error('Error updating directive:', error)
      toast.error('Failed to update directive. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDirectiveDelete = async (directiveId: string) => {
    if (!agent || !authUser) return

    try {
      setIsSubmitting(true)
      await axios.delete(`/api/agents/${agent._id}/memory/${directiveId}`)

      // Update the local state
      setUnabsorbedDirectives(prev =>
        prev.filter(directive => directive._id !== directiveId)
      )

      toast.success('Directive removed successfully')
    } catch (error) {
      console.error('Error deleting directive:', error)
      toast.error('Failed to remove directive. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-accent to-accent/50 p-3 md:p-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between">
            {/* Memory Type Tabs - Side Menu - Show if owner */}
            {collectiveMemoryAccess.showTab && (
              <div className="flex md:flex-col gap-1 mb-3 md:mb-0 md:mr-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMemoryTab('user')}
                      className={cn(
                        'flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-w-[110px]',
                        memoryTab === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                          : 'bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-purple-200/30 dark:border-purple-500/20 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300',
                      )}
                    >
                      User Memory
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>This is your personal memory with {agent.name}, extracted from all your conversations with this agent. These memories only affect your own interactions with {agent.name}.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMemoryTab('collective')}
                      className={cn(
                        'flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-w-[110px]',
                        memoryTab === 'collective'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                          : 'bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-purple-200/30 dark:border-purple-500/20 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300',
                      )}
                    >
                      Collective Memory
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>This is {agent.name}'s collective memory. This memory is formed and evolved by all its conversations with all users. Collective memory is a powerful, experimental feature that enables many new applications for creative agents that are driven by collective group interaction.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
            {/* Title */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white/95 dark:text-white/90" style={{textShadow: '0 0 20px rgba(147, 51, 234, 0.3)'}}>
                Manage {agent.name}'s memories
              </h1>
            </div>
          </div>

          {/* Tab Content */}
          {memoryTab === 'user' ? (
            <div className="space-y-8">
              <div className="relative group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h2 className="text-lg font-semibold text-purple-700 dark:text-purple-300 cursor-help">
                        User Memory
                      </h2>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>This is your personal memory with {agent.name}, extracted from all your conversations with this agent. These memories only affect your own interactions with {agent.name}.</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent dark:from-purple-500/30"></div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-purple-200/50 dark:border-purple-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10"></div>
                  <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[120px] max-h-[250px] overflow-y-auto">
                    {displayContent || (
                      <span className="text-muted-foreground italic">
                        💭 No user memories stored yet. Just interact with {agent.name} and memories will automatically appear here.
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleEditClick}
                    size="sm"
                    className="absolute bottom-3 right-3 bg-purple-500 hover:bg-purple-600 text-white shadow-md transition-all duration-200 hover:scale-105"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Unabsorbed Directives Display - Only show if there are directives */}
              {console.log('DEBUG: About to render, unabsorbedDirectives.length:', unabsorbedDirectives.length)}
              {unabsorbedDirectives.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                      Recent Context
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-500/30"></div>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
                      Will be integrated soon
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {unabsorbedDirectives.map((directive, index) => (
                      <div key={directive._id} className="relative group">
                        <div className="relative overflow-hidden rounded-lg border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 to-orange-50/30 dark:from-amber-900/5 dark:to-orange-900/5"></div>
                          <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                            <div className="text-gray-700 dark:text-gray-300">
                              {directive.content}
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              onClick={() => handleDirectiveEdit(directive)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 hover:text-amber-700 rounded-full"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleDirectiveDelete(directive._id)}
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
          ) : (
            <CollectiveMemory 
              agent={agent}
              hasAccess={collectiveMemoryAccess.hasAccess}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Memory</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Enter memories, context, or notes about your conversations with this agent..."
                        className="min-h-[300px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>{field.value?.length || 0} characters</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
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

      {/* Directive Edit Modal */}
      <Dialog open={isDirectiveEditModalOpen} onOpenChange={setIsDirectiveEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Directive</DialogTitle>
            <DialogDescription>
              Edit this recent directive content
            </DialogDescription>
          </DialogHeader>
          <Form {...directiveForm}>
            <form onSubmit={directiveForm.handleSubmit(handleDirectiveUpdate)} className="space-y-4">
              <FormField
                control={directiveForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Enter directive content..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span></span>
                      <span>{field.value?.length || 0} / 100</span>
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
                    setIsDirectiveEditModalOpen(false)
                    setEditingDirective(null)
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

export default AgentMemoryView
