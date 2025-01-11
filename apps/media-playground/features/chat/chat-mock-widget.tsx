'use client'

import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { AgentLink } from '@/features/chat/chat'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import {
  ThreadsCreateArguments,
  ThreadsCreateResponse,
} from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError, AxiosInstance } from 'axios'
import { Keyboard, Loader2Icon, SendIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const chatMockSchema = z.object({
  message: z.string().min(1).max(30000),
  attachments: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof chatMockSchema>

export const ChatMockWidget = () => {
  const { agent } = useAgentQuery({ key: siteConfig.featured.agents[0] })
  const { verifyAuth } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [shouldShowHint, setShouldShowHint] = useState(false)

  //@todo: use defaults to repopulate on return from auth redirect - if any
  const defaultValues: FormData = {
    message: '',
    attachments: [],
  }

  const form = useForm<FormData>({
    resolver: zodResolver(chatMockSchema), // use generated form schema for resolver
    defaultValues,
  })

  const message = form.watch('message')

  // Add this effect to handle hint visibility
  useEffect(() => {
    const messageLength = message?.length || 0
    setShouldShowHint(messageLength > 3)
  }, [message])

  async function onSubmit(formData: FormData) {
    const finalData = { ...defaultValues, ...formData }

    if (!(await verifyAuth())) {
      return
    }

    setIsSubmitting(true)

    // console.log('onSubmit', finalData)
    // return

    try {
      const response = await axios.post<
        AxiosInstance,
        { data: ThreadsCreateResponse },
        ThreadsCreateArguments
      >('/api/threads', {
        agent_id: siteConfig.featured.agents[0],
        content: finalData.message,
        attachments: finalData.attachments,
      })

      console.log({ response })

      if (!response || !response.data || !response.data?.thread_id) {
        toast.error(`Failed to create thread!`, {
          description: JSON.stringify(response),
          dismissible: true,
          richColors: true,
        })
        return
      }

      // redirect to /chat/:agentId/:threadId
      router.push(
        `/chat/${siteConfig.featured.agents[0]}/${response.data.thread_id}`,
      )
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'

      toast.error(`Failed to create thread!`, {
        description: JSON.stringify(errorMessage),
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="chat-mock-widget">
      <div className="mb-4">
        <AgentLink agent={agent} className="h-12 w-12 md:h-16 md:w-16" />
        <div className="inline-flex ml-16 p-2 mt-2 bg-purple-600/25 rounded-lg rounded-tl-none">
          How can i help you today?
        </div>
      </div>
      <Form {...form}>
        <form
          className="flex gap-2 w-full bg-popover rounded-lg p-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            name="message"
            render={({ field }) => (
              <FormItem className="w-full relative">
                <FormControl id={'message'}>
                  <AutosizeTextarea
                    className="w-full mb-2 !border-none !ring-0 !outline-none"
                    placeholder="Type your message here..."
                    rows={4}
                    minHeight={96}
                    autoFocus={true}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value || ''}
                    disabled={isSubmitting}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (form.formState.isValid && !isSubmitting) {
                          form.handleSubmit(onSubmit)()
                        }
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
                <div
                  className={cn(
                    'absolute bottom-4 right-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-all duration-200',
                    shouldShowHint
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 pointer-events-none',
                  )}
                >
                  <Keyboard className="h-3 w-3" />
                  <span className="opacity-70">
                    Enter to send, Shift+Enter for new line
                  </span>
                </div>
              </FormItem>
            )}
          />
          <div
            className={cn(
              'flex justify-end transition-all origin-center opacity-0 translate-y-4',
              isSubmitting && 'opacity-50 translate-y-0',
              form.formState.isValid && 'opacity-100 translate-y-0 ',
            )}
          >
            <Button
              variant="secondary"
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
