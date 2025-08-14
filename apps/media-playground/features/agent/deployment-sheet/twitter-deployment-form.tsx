'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  userId: z.string(),
  username: z.string(),
  bearerToken: z.string(),
  consumerKey: z.string(),
  consumerSecret: z.string(),
  accessToken: z.string(),
  accessTokenSecret: z.string(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface TwitterDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const TwitterDeploymentForm = ({
  agentId,
  deployment,
}: TwitterDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: '',
      username: '',
      bearerToken: '',
      consumerKey: '',
      consumerSecret: '',
      accessToken: '',
      accessTokenSecret: '',
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Twitter"
        tooltip="Deploy your agent to Twitter"
        valid={deployment?.valid}
      />
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          isDeployed ? 'border-success' : '',
          deployment?.valid === false ? 'border-destructive' : '',
        ])}
      >
        <Form {...form}>
          <form className="flex flex-col w-full space-y-4 p-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your Twitter user ID"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Your Twitter user ID.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your Twitter username"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Your Twitter username.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TokenField
              form={form}
              name="bearerToken"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Bearer Token"
              description="Your Twitter bearer token."
            />
            <TokenField
              form={form}
              name="consumerKey"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="API Key"
              description="Your Twitter API key."
            />
            <TokenField
              form={form}
              name="consumerSecret"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="API Secret Key"
              description="Your Twitter API secret key."
            />
            <TokenField
              form={form}
              name="accessToken"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Access Token"
              description="Your Twitter access token."
            />
            <TokenField
              form={form}
              name="accessTokenSecret"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Access Token Secret"
              description="Your Twitter access token secret."
            />
            <DeploymentFormFooter
              agentId={agentId}
              platform="twitter"
              form={form}
              isDeployed={isDeployed}
              valid={deployment?.valid}
              guideUrl="https://docs.eden.art/docs/guides/twitter/"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
