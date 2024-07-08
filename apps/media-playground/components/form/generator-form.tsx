'use client'

import ImageStyleSelector, {
  ImageStyle,
} from '@/components/form/image-style-selector'
import SettingsFormDrawer from '@/components/form/settings-form-drawer'
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
import { useToast } from '@/components/ui/use-toast'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// @todo: also needs to be derived from fastify
const FormSchema = z.object({
  prompt: z
    .string()
    .min(3, {
      message: 'Text Prompt must be at least 3 characters.',
    })
    .max(2000, {
      message: 'Text Prompt must not be longer than 2000 characters.',
    }),
})

type Props = {
  generator: GeneratorV2
}

const GeneratorForm = ({ generator }: Props) => {
  const [imageStyles, setImageStyles] = useState<ImageStyle[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    //@todo: derive values and their defaults from passed in generator metadata
    defaultValues: {
      prompt: '',
    },
  })

  const { toast } = useToast()

  async function onSubmit(formData: z.infer<typeof FormSchema>) {
    console.log('onSubmit', formData)
    setIsSubmitting(true)

    try {
      const response = await axios.post('/api/tasks/create', {
        workflow: generator.name,
        args: formData,
      })

      console.log({ response })

      toast({
        className: 'flex p-4',
        title: 'Task submitted',
        description: (
          <div className="mt-2 rounded-md bg-popover p-2">
            <code className=" text-xs text-foreground">
              x{JSON.stringify(formData, null, 2)}
            </code>
          </div>
        ),
        // action: <ToastAction altText="Go to task">Show Task</ToastAction>,
      })
    } catch (err) {
      console.log(err)
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'
      toast({
        className: 'flex p-4 text-red-600',
        title: 'Failed to submit task',
        description: (
          <div className="rounded-md text-primary">
            {JSON.stringify(errorMessage)}
          </div>
        ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-start">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full sticky top-24"
        >
          <div className="bg-popover rounded-lg overflow-hidden">
            <FormField
              control={form.control}
              name="prompt"
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
            {imageStyles && imageStyles.length ? (
              <div className="text-xs">
                debug: selected styles
                <pre>{JSON.stringify(imageStyles, null, 2)}</pre>
              </div>
            ) : null}
          </div>

          <div className="flex gap-4 mt-4">
            <SettingsFormDrawer />

            <Button type="submit" className="ml-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                <>Create</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default GeneratorForm
