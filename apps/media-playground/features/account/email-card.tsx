'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const updateEmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
})

type UpdateEmailDto = z.infer<typeof updateEmailSchema>

const EmailCard = ({ primaryEmail }: { primaryEmail: string }) => {
  const form = useForm<UpdateEmailDto>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      email: primaryEmail,
    },
  })

  const onSubmit = async (data: UpdateEmailDto) => {
    try {
      await axios.post('/api/account', {
        requestType: 'updateEmail',
        email: data.email,
      })
      toast.success('Email updated successfully', {
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError ? (error.response?.data as string) : ''
      toast.error('Failed to update email', {
        description: errorMessage,
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>Your primary email address.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Email..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button disabled={form.formState.isSubmitting}>Save</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

export default EmailCard
