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
import { useAuthState } from '@/hooks/use-auth-state'
import { isAgentOwner } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Agent, FeatureFlag } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Edit, Loader2 } from 'lucide-react'
import { FC, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// Schema for memory form
const memorySchema = z.object({
  content: z.string().optional(),
})

type MemoryFormDto = z.infer<typeof memorySchema>

const AgentMemoryView: FC<{
  agent: Agent
  user: unknown
}> = ({ agent, user }) => {
  const { user: authUser } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unabsorbedDirectives, setUnabsorbedDirectives] = useState<string[]>([])
  const [memoryTab, setMemoryTab] = useState<'user' | 'collective'>('user')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [displayContent, setDisplayContent] = useState('')

  const isOwner = useMemo(() => {
    return isAgentOwner(agent, authUser?._id)
  }, [agent, authUser])

  const isPreviewUser = authUser?.featureFlags?.includes(FeatureFlag.Preview)

  const form = useForm<MemoryFormDto>({
    resolver: zodResolver(memorySchema),
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

  return (
    <>
      <div className="flex-1 overflow-auto bg-accent p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-center">Manage {agent.name}'s memories</h1>
          </div>

          {/* Memory Type Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setMemoryTab('user')}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
                  memoryTab === 'user' &&
                    'bg-background text-foreground shadow-sm',
                )}
              >
                User Memory
              </button>
              {isOwner && (
                <button
                  onClick={() => setMemoryTab('collective')}
                  className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
                    memoryTab === 'collective' &&
                      'bg-background text-foreground shadow-sm',
                  )}
                >
                  Collective Memory
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {memoryTab === 'user' ? (
            <div className="space-y-6">
              <div className="relative">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Persistent Agent/User Memory
                </label>
                <div className="mt-2 w-full rounded-md border border-input bg-background px-3 py-3 text-sm min-h-[300px] whitespace-pre-wrap">
                  {displayContent || (
                    <span className="text-muted-foreground">
                      No memories stored yet. Click Edit to add memories, context, or notes about your conversations with this agent.
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleEditClick}
                  variant="outline"
                  size="sm"
                  className="absolute bottom-3 right-3"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>

              {/* Unabsorbed Directives Display - Only show if there are directives */}
              {unabsorbedDirectives.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Recent Directives (will be automatically integrated into
                    persistent memory soon)
                  </label>
                  <div className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm resize-none">
                    {unabsorbedDirectives.map((directive, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <span className="text-muted-foreground">•</span>{' '}
                        {directive}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Collective Memory Tab Content */
            <div className="space-y-6">
              {!isPreviewUser ? (
                <div className="text-center py-8 text-muted-foreground">
                  Collective Memory is in early alpha. Please talk to Eden devs for access
                </div>
              ) : (
                <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[300px]">
                  {/* Empty placeholder for collective memory content */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Memory</DialogTitle>
            <DialogDescription>
              Add memories, context, or notes about your conversations with {agent.name}
            </DialogDescription>
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
    </>
  )
}

export default AgentMemoryView
