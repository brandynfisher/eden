'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
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
  storeName: z.string(),
  accessToken: z.string(),
  locationId: z.string(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface ShopifyDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const ShopifyDeploymentForm = ({
  agentId,
  deployment,
}: ShopifyDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

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

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Shopify"
        tooltip="Deploy your agent to Shopify"
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
            <TokenField
              form={form}
              name="storeName"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Store Name"
              description="Your Shopify store name (e.g., my-store)."
            />
            <TokenField
              form={form}
              name="accessToken"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Access Token"
              description="Your Shopify access token."
            />
            <TokenField
              form={form}
              name="locationId"
              isDeployed={isDeployed}
              isSubmitting={form.formState.isSubmitting}
              label="Location ID"
              description="Your Shopify location ID (number)."
            />
            <DeploymentFormFooter
              agentId={agentId}
              platform="shopify"
              form={form}
              isDeployed={isDeployed}
              valid={deployment?.valid}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
