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
import { useAuthState } from '@/hooks/use-auth-state'
import { env } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import {
  MannaVoucherRedeemResponse,
  createEdenClient,
} from '@edenlabs/eden-sdk-v3'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  code: z.string().trim().min(3, { message: 'Code is required' }),
})

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const { message } = err as { message?: unknown }
    if (typeof message === 'string' && message.length) {
      return message
    }
  }
  return 'Unknown Error'
}

type RedeemVoucherFormProps = {
  onSuccess?: () => void
}

const RedeemVoucherForm = ({ onSuccess }: RedeemVoucherFormProps) => {
  const { refetchMe } = useAuthState()
  const { getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Not authenticated')
      }

      const eden = createEdenClient({
        baseUrl: env.NEXT_PUBLIC_EDEN_API_URL,
        token,
      })

      const response: MannaVoucherRedeemResponse =
        await eden.manna.redeemVoucher({
          code: values.code.trim(),
        })

      toast.success(`Code redeemed`, {
        description: (
          <code className=" text-xs text-foreground">
            {response.action || 'Voucher redeemed'}
          </code>
        ),
        dismissible: true,
        richColors: true,
      })

      await refetchMe()
      onSuccess?.()
    } catch (err) {
      console.error(err)
      // openapi-fetch resolves non-2xx into `{ error }` holding the parsed body,
      // and the SDK rethrows that body as-is — a plain object, never an Error.
      // Reading only `err.message` off an Error therefore threw away every
      // server-side reason ("voucher expired", "already redeemed", 401 "User
      // not found") and showed "Unknown Error" for all of them.
      const message = getErrorMessage(err)

      toast.error(`Failed to redeem code!`, {
        description: JSON.stringify(message),
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogTitle>Redeem Voucher</DialogTitle>
      <DialogDescription>
        Here you can claim vouchers that grant free manna or allow access to
        special features or previews.
      </DialogDescription>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className=" flex flex-col w-full">
                <FormLabel className="py-2">Voucher Code</FormLabel>
                <FormControl className="!mt-0">
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Code" {...field} />
                    <Button
                      onClick={
                        !isSubmitting ? form.handleSubmit(onSubmit) : undefined
                      }
                      disabled={isSubmitting}
                      className="!mt-0"
                      type="submit"
                      variant="outline"
                    >
                      Submit
                    </Button>
                  </div>
                </FormControl>
                {/*<FormDescription>*/}
                {/*  Your Early Access Token*/}
                {/*</FormDescription>*/}
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </>
  )
}

export default RedeemVoucherForm
