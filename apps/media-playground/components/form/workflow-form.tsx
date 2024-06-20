'use client'

import ImageStyleSelector, {
  ImageStyle,
} from '@/components/form/image-style-selector'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { useWebSocketContext } from '@/provider/websocket-provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  text_prompt: z
    .string()
    .min(3, {
      message: 'Text Prompt must be at least 3 characters.',
    })
    .max(2000, {
      message: 'Text Prompt must not be longer than 2000 characters.',
    }),
})

const WorkflowForm = () => {
  const { sendJsonMessage } = useWebSocketContext()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      text_prompt: '',
    },
  })
  const { toast } = useToast()

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)

    sendJsonMessage({ event: 'task-create', data })

    toast({
      className: 'flex p-4',
      title: 'Task submitted',
      description: (
        <div className="mt-2 rounded-md bg-slate-950 p-2">
          <code className=" text-xs text-foreground">
            {JSON.stringify(data, null, 2)}
          </code>
        </div>
      ),
      action: <ToastAction altText="Go to task">Show Task</ToastAction>,
    })
  }

  const [imageStyles, setImageStyles] = useState<ImageStyle[]>([])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="bg-popover rounded-lg overflow-hidden">
          <FormField
            control={form.control}
            name="text_prompt"
            render={({ field }) => (
              <FormItem className="mt-0 !px-4 !py-3">
                <FormLabel className="sr-only">Text Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    spellCheck={false}
                    placeholder="What do you want to create?"
                    className="!mt-0 !ml-0 !px-0 !py-0 resize-none border-0 !outline-0 !outline-none !ring-0 overflow-hidden rounded-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ImageStyleSelector
            onChange={selectedStyles => setImageStyles(selectedStyles)}
          />
          <div className="text-xs">
            debug: selected styles
            <pre>{JSON.stringify(imageStyles, null, 2)}</pre>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Button type="submit" className="ml-auto">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default WorkflowForm
