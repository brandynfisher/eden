'use client'

import { Button } from '@/components/ui/button'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  subject: z
    .string()
    .max(200, { message: 'Subject must be 200 characters or less' })
    .optional(),
  category: z
    .string()
    .max(120, { message: 'Category must be 120 characters or less' })
    .optional(),
  message: z
    .string()
    .min(10, { message: 'Please share at least 10 characters of detail' })
    .max(5000, { message: 'Feedback must be 5000 characters or less' }),
})

const FeedbackForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      category: '',
      message: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    const payload = {
      subject: values.subject?.trim() || undefined,
      category: values.category?.trim() || undefined,
      message: values.message.trim(),
    }

    try {
      const response = await axios.post('/api/user/feedback', payload)
      const remaining = response?.data?.remainingSubmissionsToday

      toast.success('Thanks for the feedback!', {
        description:
          typeof remaining === 'number'
            ? `Consider joining our Discord server to get support and stay updated on new features.`
            : undefined,
        dismissible: true,
        richColors: true,
      })

      form.reset({
        subject: '',
        category: '',
        message: '',
      })
    } catch (err) {
      console.error(err)
      const message = axios.isAxiosError(err)
        ? (err as AxiosError<{ message?: string }>)?.response?.data?.message ||
          err.message
        : 'Unknown error'

      toast.error('Unable to send feedback', {
        description: message,
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogTitle>Send Feedback</DialogTitle>
      <DialogDescription>
        Share bugs, requests, or ideas directly with the Eden team (limit 5
        messages per day).
      </DialogDescription>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional subject"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional (e.g. bug, idea, billing)"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="How can we help? Please include as much detail as possible."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}

export default FeedbackForm
