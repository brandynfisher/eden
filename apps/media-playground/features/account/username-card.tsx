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
import { useAuthState } from '@/hooks/use-auth-state'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' }),
})

type UpdateUsernameDto = z.infer<typeof updateUsernameSchema>

const UsernameCard = () => {
  const { user } = useAuthState()

  const form = useForm<UpdateUsernameDto>({
    resolver: zodResolver(updateUsernameSchema),
    defaultValues: {
      username: user?.username || '',
    },
  })

  React.useEffect(() => {
    if (user) {
      form.setValue('username', user.username || '')
    }
  }, [form, user])

  const onSubmit = async (data: UpdateUsernameDto) => {
    try {
      await axios.post('/api/account', {
        requestType: 'updateUsername',
        username: data.username,
      })
      toast.success('Username updated successfully', {
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      toast.error('Failed to update username', {
        dismissible: true,
        richColors: true,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Username</CardTitle>
        <CardDescription>Your namespace within Eden.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Username..." {...field} />
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

export default UsernameCard
