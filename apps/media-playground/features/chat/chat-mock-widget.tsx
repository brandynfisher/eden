'use client'

import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { Form } from '@/components/ui/form'
import { AgentLink } from '@/features/chat/chat'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { siteConfig } from '@/lib/config'
import {
  ThreadsCreateArguments,
  ThreadsMessageResponse,
} from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError, AxiosInstance } from 'axios'
import { SendIcon } from 'lucide-react'
import { useState } from 'react'
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
  const { verifyAuth, refetchMe } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

  //@todo: use defaults to repopulate on return from auth redirect - if any
  const defaultValues: FormData = {
    message: '',
    attachments: [],
  }

  const form = useForm<FormData>({
    resolver: zodResolver(chatMockSchema), // use generated form schema for resolver
    defaultValues,
  })

  // const formValues = form.watch()

  async function onSubmit(formData: FormData) {
    const finalData = { ...defaultValues, ...formData }
    console.log('onSubmit', finalData)

    if (!(await verifyAuth())) {
      return
    }

    // console.log('onSubmit', finalData)

    setIsSubmitting(true)
    try {
      const response = await axios.post<
        AxiosInstance,
        ThreadsMessageResponse,
        ThreadsCreateArguments
      >('/api/threads', {
        agent_id: siteConfig.featured.agents[0],
        content: finalData.message,
        attachments: finalData.attachments,
      })

      console.log({ response })

      // toast.success(`Task submitted`, {
      //   description: (
      //     <code className="text-xs text-foreground">Tool: {tool.key}</code>
      //   ),
      //   dismissible: true,
      //   richColors: true,
      // })

      // onSubmitSuccess()
      await refetchMe()
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
        <AgentLink agent={agent} />
        <div className=" inline-flex ml-8 p-2 mt-1 bg-secondary rounded-lg rounded-tl-none">
          How can i help you today?
        </div>
      </div>
      <Form {...form}>
        <form className="w-full">
          <AutosizeTextarea
            defaultValue={defaultValues.message}
            id="message"
            name="message"
            className="w-full mb-2"
            placeholder="Type your message here..."
            rows={4}
            minHeight={96}
          />
          <div className="flex justify-end">
            <Button
              variant="secondary"
              type="submit"
              onClick={!isSubmitting ? form.handleSubmit(onSubmit) : undefined}
              disabled={isSubmitting}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
