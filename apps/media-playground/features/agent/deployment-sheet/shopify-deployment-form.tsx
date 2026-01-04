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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  storeName: z.string(),
  accessToken: z.string(),
  locationId: z.string(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface ShopifyDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const ShopifyDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: ShopifyDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: '',
      accessToken: '',
      locationId: '',
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (isInline) return
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed, isInline])

  const open = isInline ? true : isOpen

  return (
    <Collapsible
      className="w-full"
      open={open}
      onOpenChange={value => {
        if (!isInline) setIsOpen(value)
      }}
    >
      <DeploymentCollapsibleTrigger
        isOpen={open}
        isDeployed={isDeployed}
        label="Shopify"
        tooltip="Deploy your agent to Shopify"
        valid={deployment?.valid}
        isStatic={isInline}
      />
      <CollapsibleContent
        className={cn([
          open
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
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-store"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Shopify store name (e.g., my-store).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <TokenField
              form={form}
              name="accessToken"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Access Token"
              description="Your Shopify access token."
            />
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Location ID"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your Shopify location ID (number).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DeploymentFormFooter
              agentId={agentId}
              platform="shopify"
              form={form}
              isDeployed={isDeployed}
              valid={deployment?.valid}
              guideUrl="https://docs.eden.art/integrations/shopify"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
