'use client'

import CollectiveMemory from './collective-memory'
import { MEMORY_ERROR_MESSAGES, MEMORY_LIMITS } from './memory-constants'
import MemoryEditConfirmationDialog from './memory-edit-confirmation-dialog'
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
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
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
      MEMORY_LIMITS.USER_MEMORY_CONTENT_MAX_CHARS,
      MEMORY_ERROR_MESSAGES.USER_MEMORY_CONTENT_MAX_CHARS,
    )
    .optional(),
})

type MemoryFormDto = z.infer<typeof memorySchema>

interface UnabsorbedDirective {
  _id: string
  content: string
  createdAt?: string
}

const AgentMemoryView: FC<{
  agent: Agent
}> = ({ agent }: { agent: Agent }) => {
  const { user: authUser } = useAuthState()
  const { hasEditAccess } = useAgentPermissions(agent, authUser?._id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unabsorbedDirectives, setUnabsorbedDirectives] = useState<
    UnabsorbedDirective[]
  >([])
  const [memoryTab, setMemoryTab] = useState<'user' | 'collective'>('user')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDirectiveEditModalOpen, setIsDirectiveEditModalOpen] =
    useState(false)
  const [editingDirective, setEditingDirective] =
    useState<UnabsorbedDirective | null>(null)
  const [displayContent, setDisplayContent] = useState('')
  const [isUserMemoryConfirmationOpen, setIsUserMemoryConfirmationOpen] =
    useState(false)
  const [pendingUserMemoryData, setPendingUserMemoryData] =
    useState<MemoryFormDto | null>(null)
  const [isDirectiveConfirmationOpen, setIsDirectiveConfirmationOpen] =
    useState(false)
  const [pendingDirectiveData, setPendingDirectiveData] =
    useState<MemoryFormDto | null>(null)
  const [userMemoryEnabled, setUserMemoryEnabled] = useState<boolean>(true)

  // Collective Memory Access Logic - Three Scenarios:
  // 1. Not editor/owner: no tab visible (handled by hasEditAccess check)
  // 2. Editor/owner with Preview flag: full functionality (bypasses subscription checks)
  // 3. Editor/owner with Pro+ tier: full functionality
  // 4. Editor/owner with lower tier: show upgrade prompt
  const collectiveMemoryAccess = useMemo(() => {
    if (!hasEditAccess) {
      return { showTab: false, hasAccess: false, needsPreview: false }
    }

    // User has edit access - always show tab
    if (!authUser) {
      return { showTab: true, hasAccess: false, needsPreview: false }
    }

    const hasPreviewFlag = authUser?.featureFlags?.includes(FeatureFlag.Preview)
    const hasProTier = (authUser?.subscriptionTier ?? 0) >= 2 // Pro tier or higher

    // Preview feature flag gives access regardless of subscription tier
    if (hasPreviewFlag) {
      return { showTab: true, hasAccess: true, needsPreview: false }
    }

    // Pro tier users get access
    if (hasProTier) {
      return { showTab: true, hasAccess: true, needsPreview: false }
    }

    // Lower tier users see upgrade prompt
    return { showTab: true, hasAccess: false, needsPreview: false }
  }, [hasEditAccess, authUser?.subscriptionTier, authUser?.featureFlags])

  const form = useForm<MemoryFormDto>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      content: '',
    },
  })

  const directiveForm = useForm<MemoryFormDto>({
    resolver: zodResolver(
      z.object({
        content: z
          .string()
          .max(
            MEMORY_LIMITS.DIRECTIVE_CONTENT_MAX_CHARS,
            MEMORY_ERROR_MESSAGES.DIRECTIVE_CONTENT_MAX_CHARS,
          )
          .optional(),
      }),
    ),
    defaultValues: {
      content: '',
    },
  })

  // Initialize and load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (agent && authUser) {
        // 1. Set toggle state from agent prop
        const isUserMemoryEnabled =
          agent.user_memory_enabled !== undefined
            ? agent.user_memory_enabled
            : false
        setUserMemoryEnabled(isUserMemoryEnabled)

        // 2. If enabled, fetch memory data; if disabled, clear display
        if (isUserMemoryEnabled) {
          try {
            const response = await axios.get(`/api/agents/${agent._id}/memory`)
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
        } else {
          form.setValue('content', '')
          setDisplayContent('')
          setUnabsorbedDirectives([])
        }
      }
    }

    loadData()
  }, [agent?._id, authUser, form, agent?.user_memory_enabled])

  const handleSubmit = async (data: MemoryFormDto) => {
    if (!agent || !authUser) return

    // Show confirmation dialog first
    setPendingUserMemoryData(data)
    setIsUserMemoryConfirmationOpen(true)
  }

  const handleConfirmedSubmit = async () => {
    if (!agent || !authUser || !pendingUserMemoryData) return

    try {
      setIsSubmitting(true)
      await axios.post(`/api/agents/${agent._id}/memory`, {
        content: pendingUserMemoryData.content || '',
      })
      setDisplayContent(pendingUserMemoryData.content || '')
      toast.success('Memory saved successfully')
      setIsEditModalOpen(false)
      setPendingUserMemoryData(null)
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

    // Show confirmation dialog first
    setPendingDirectiveData(data)
    setIsDirectiveConfirmationOpen(true)
  }

  const handleConfirmedDirectiveUpdate = async () => {
    if (!editingDirective || !agent || !authUser || !pendingDirectiveData)
      return

    try {
      setIsSubmitting(true)
      await axios.patch(`/api/memory-sessions/${editingDirective._id}`, {
        content: pendingDirectiveData.content || '',
      })

      // Update the local state
      setUnabsorbedDirectives(prev =>
        prev.map(directive =>
          directive._id === editingDirective._id
            ? { ...directive, content: pendingDirectiveData.content || '' }
            : directive,
        ),
      )

      toast.success('Directive updated successfully')
      setIsDirectiveEditModalOpen(false)
      setEditingDirective(null)
      setPendingDirectiveData(null)
    } catch (error) {
      console.error('Error updating directive:', error)
      toast.error('Failed to update directive. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleUserMemoryEnabled = async () => {
    if (!agent || !authUser) return

    try {
      setIsSubmitting(true)
      const newValue = !userMemoryEnabled

      // 1. Update MongoDB through API
      await axios.patch(`/api/agents/${agent._id}/user-memory-enabled`, {
        user_memory_enabled: newValue,
      })

      // 2. Update local toggle state
      setUserMemoryEnabled(newValue)

      // 3. Refresh display based on new state
      if (newValue) {
        // If enabled, fetch memory data
        try {
          const response = await axios.get(`/api/agents/${agent._id}/memory`)
          const content = response.data.content || ''
          form.setValue('content', content)
          setDisplayContent(content)
          setUnabsorbedDirectives(response.data.unabsorbedDirectives || [])
        } catch (error) {
          console.error('Error loading memory data after toggle:', error)
        }
      } else {
        // If disabled, clear display
        form.setValue('content', '')
        setDisplayContent('')
        setUnabsorbedDirectives([])
      }

      toast.success(`User memory ${newValue ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error toggling user memory enabled state:', error)

      const getErrorMessage = (error: unknown): string => {
        if (axios.isAxiosError(error)) {
          const responseData = error.response?.data
          if (responseData?.message) {
            return responseData.message
          } else if (responseData?.error) {
            return responseData.error
          }

          switch (error.response?.status) {
            case 404:
              return 'Agent not found'
            case 401:
              return 'You are not authorized to perform this action'
            case 403:
              return 'You do not have permission to perform this action'
            case 400:
              return 'Invalid request data'
            default:
              return 'Failed to update user memory state'
          }
        }
        return 'Failed to update user memory state'
      }

      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDirectiveDelete = async (directiveId: string) => {
    if (!agent || !authUser) return

    // Store the directive being deleted in case we need to revert
    const directiveToDelete = unabsorbedDirectives.find(
      d => d._id === directiveId,
    )
    if (!directiveToDelete) return

    // Optimistically update the UI immediately
    setUnabsorbedDirectives(prev =>
      prev.filter(directive => directive._id !== directiveId),
    )

    try {
      await axios.delete(`/api/agents/${agent._id}/memory/${directiveId}`)
      // Success - no toast notification to avoid blocking UI
    } catch (error) {
      // Revert the optimistic update on error
      setUnabsorbedDirectives(prev => [...prev, directiveToDelete])
      console.error('Error deleting directive:', error)
      toast.error('Failed to remove directive. Please try again.')
    }
  }

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-auto bg-accent p-3 md:p-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4">
            {/* Title */}
            <div className="text-left w-full mb-6">
              <h1 className="text-3xl font-bold text-foreground">
                Manage {agent.name}'s memories
              </h1>
            </div>
          </div>

          {/* Tab Toggle - Always show at top level */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-border rounded-full"></div>
                {/* Memory Type Toggle - Switch style buttons */}
                {collectiveMemoryAccess.showTab ? (
                  <div className="relative inline-flex items-center bg-muted rounded-lg p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setMemoryTab('user')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-help w-32 ${
                            memoryTab === 'user'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          User
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p>
                          This is your personal preferences memory with{' '}
                          {agent.name}, extracted from all your conversations
                          with this agent. These memories only affect your own
                          interactions with {agent.name} and primarily store
                          custom instructions you give to the agent.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setMemoryTab('collective')}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-help w-32 ${
                            memoryTab === 'collective'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Collective
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p>
                          This is {agent.name}'s collective memory. This memory
                          is formed and evolved by all its conversations with
                          all users. Collective memory is a powerful,
                          experimental feature that enables many new
                          applications for creative agents that are driven by
                          collective group interaction.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <h2 className="text-lg font-semibold text-foreground ml-2">
                    User Memory
                  </h2>
                )}
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* User Memory Active/Disabled Toggle - Moved to inline position */}
              {memoryTab === 'user' && hasEditAccess && (
                <div className="flex items-center gap-3 md:justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`text-sm font-medium cursor-help ${
                          userMemoryEnabled
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {userMemoryEnabled ? 'Active' : 'Disabled'}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {userMemoryEnabled
                          ? 'User memory is active and will be used in conversations'
                          : 'User memory is disabled and will not be used in conversations'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Switch
                    checked={userMemoryEnabled}
                    onCheckedChange={handleToggleUserMemoryEnabled}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {memoryTab === 'user' ? (
            <div className="space-y-8">
              <div className="relative group">
                <div className="group relative rounded-lg border border-border bg-blue-50/20 dark:bg-blue-950/15 shadow-sm">
                  <div className="relative px-4 py-4 text-sm whitespace-pre-wrap min-h-[150px] max-h-[312px] overflow-y-auto">
                    {displayContent || (
                      <span className="text-muted-foreground italic">
                        {!userMemoryEnabled
                          ? '💭 User specific memories for this agent are currently disabled by the agent owner.\n(Collective Memory could still be active but is only visible to agent owners)'
                          : `💭 No user memories stored yet. Just interact with ${agent.name} and custom instructions you give to the agent will automatically appear here.`}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleEditClick}
                    size="sm"
                    className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Unabsorbed Directives Display - Only show if there are directives and user memory is enabled */}
              {unabsorbedDirectives.length > 0 && userMemoryEnabled && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-border rounded-full"></div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h2 className="text-lg font-semibold text-foreground cursor-help">
                          Recent Context
                        </h2>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p>
                          These are new directives picked up from recent
                          conversations that will be integrated into User Memory
                          soon.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full border border-border">
                      Will be integrated soon
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {unabsorbedDirectives.map(directive => (
                      <div key={directive._id} className="relative group">
                        <div className="rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                          <div className="relative px-4 py-3 text-sm whitespace-pre-wrap pr-20">
                            <div className="text-foreground">
                              {directive.content}
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              onClick={() => handleDirectiveEdit(directive)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() =>
                                handleDirectiveDelete(directive._id)
                              }
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-muted text-destructive hover:text-destructive rounded-full"
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
              onTabChange={setMemoryTab}
              showTabToggle={false}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
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
              onSubmit={form.handleSubmit(handleSubmit)}
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
                        {MEMORY_LIMITS.USER_MEMORY_CONTENT_MAX_CHARS}
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

      {/* Directive Edit Modal */}
      <Dialog
        open={isDirectiveEditModalOpen}
        onOpenChange={setIsDirectiveEditModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Directive</DialogTitle>
            <DialogDescription>
              Edit this recent directive content
            </DialogDescription>
          </DialogHeader>
          <Form {...directiveForm}>
            <form
              onSubmit={directiveForm.handleSubmit(handleDirectiveUpdate)}
              className="space-y-4"
            >
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
                      <span>
                        {field.value?.length || 0} /{' '}
                        {MEMORY_LIMITS.DIRECTIVE_CONTENT_MAX_CHARS}
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

      {/* User Memory Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isUserMemoryConfirmationOpen}
        onOpenChange={setIsUserMemoryConfirmationOpen}
        onConfirm={handleConfirmedSubmit}
        title="Modify User Memory"
        description="Are you sure you want to modify this memory? Saving this will cause the original memory to be lost!"
        isSubmitting={isSubmitting}
      />

      {/* Directive Edit Confirmation Dialog */}
      <MemoryEditConfirmationDialog
        open={isDirectiveConfirmationOpen}
        onOpenChange={setIsDirectiveConfirmationOpen}
        onConfirm={handleConfirmedDirectiveUpdate}
        title="Modify Directive"
        description="Are you sure you want to modify this directive? Saving this will cause the original directive to be lost!"
        isSubmitting={isSubmitting}
      />
    </TooltipProvider>
  )
}

export default AgentMemoryView
