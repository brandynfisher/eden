'use client'

import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { useAuthState } from '@/hooks/use-auth-state'
import { ThreadMessage } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { ObjectId } from 'bson'
import { SendIcon } from 'lucide-react'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  content: z.string().min(1),
})

type MessageInputProps = {
  onSend: (message: ThreadMessage) => void
}

export const MessageInput: FC<MessageInputProps> = ({ onSend }) => {
  const { user } = useAuthState()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) return

    const newMessage: ThreadMessage = {
      id: new ObjectId().toString(),
      sender: user,
      content: data.content,
      role: 'user',
      createdAt: new Date(),
    }

    onSend(newMessage)
    form.reset()
  }

  return (
    <div className="sticky pb-6 bottom-0 z-[51] bg-aui-background w-[calc(100%-2rem)] md:w-full mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="sticky bottom-6 z-[51] border border-aui-border bg-accent-foreground/5 rounded-md items-start p-2.5 focus-within:border-aui-ring/20 transition-all duration-300"
        >
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <AutosizeTextarea
                      {...field}
                      placeholder="Write a message..."
                      className="focus-visible:ring-0 border-none bg-transparent rounded-none focus-visible:ring-offset-0"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          form.handleSubmit(onSubmit)()
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!form.formState.isValid}
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
