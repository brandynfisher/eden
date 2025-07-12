'use client'

import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
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
}> = ({ agent }) => {
  const { user: authUser } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          form.setValue('content', response.data.content || '')
        } catch (error) {
          console.error('Error loading memory data:', error)
          form.setValue('content', '')
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
      toast.success('Memory saved successfully')
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


  return (
    <div className="flex-1 overflow-auto bg-accent p-6">
      <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Manage this agent's memories</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Store and manage memories for your conversations with {agent.name}
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent/User Memory</FormLabel>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Enter memories, context, or notes about your conversations with this agent..."
                        className="min-h-[300px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
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
              </div>
            </form>
          </Form>
        </div>
      </div>
  )
}

export default AgentMemoryView